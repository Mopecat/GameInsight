import type { Country, GameEvent, GlobalFilters, PlayerProfile } from '../types/domain';

const dayMs = 24 * 60 * 60 * 1000;
type RetentionKey = `d${number}`;
type RetentionValue = number | null;

export interface RetentionCohort {
  id: string;
  installDate: string;
  country: Country;
  platform: PlayerProfile['platform'];
  channel: PlayerProfile['channel'];
  version: PlayerProfile['version'];
  size: number;
  retention: Record<RetentionKey, RetentionValue>;
  retainedUsers: Record<RetentionKey, number | null>;
  matureDays: Record<RetentionKey, boolean>;
}

export interface RetentionHeatmapPoint {
  installDate: string;
  day: number;
  rate: RetentionValue;
  retainedUsers: number | null;
  cohortSize: number;
}

export interface RetentionAnalysis {
  cohorts: RetentionCohort[];
  heatmap: RetentionHeatmapPoint[];
  summary: {
    totalUsers: number;
    cohortCount: number;
    averageRetention: Record<RetentionKey, RetentionValue>;
  };
  days: number[];
}

export function buildRetentionAnalysis(
  players: PlayerProfile[],
  events: GameEvent[],
  filters: GlobalFilters,
  days: number[] = [1, 3, 7, 14, 30],
  observationEndTimestamp = resolveObservationEndTimestamp(players, events)
): RetentionAnalysis {
  const filteredPlayers = players.filter((player) => matchesFilters(player, filters));
  const playerIds = new Set(filteredPlayers.map((player) => player.id));
  const filteredEvents = events.filter((event) => playerIds.has(event.playerId) && matchesFilters(event, filters));
  const eventsByPlayer = groupEventsByPlayer(filteredEvents);
  const cohorts = buildCohorts(filteredPlayers, eventsByPlayer, days, observationEndTimestamp);
  const heatmap = cohorts.flatMap((cohort) =>
    days.map((day) => ({
      installDate: cohort.installDate,
      day,
      rate: cohort.retention[`d${day}`],
      retainedUsers: cohort.retainedUsers[`d${day}`],
      cohortSize: cohort.size
    }))
  );

  return {
    cohorts,
    heatmap,
    summary: {
      totalUsers: filteredPlayers.length,
      cohortCount: cohorts.length,
      averageRetention: buildAverageRetention(cohorts, days)
    },
    days
  };
}

function buildCohorts(
  players: PlayerProfile[],
  eventsByPlayer: Map<string, GameEvent[]>,
  days: number[],
  observationEndTimestamp: number
): RetentionCohort[] {
  const cohortPlayers = new Map<string, PlayerProfile[]>();

  players.forEach((player) => {
    const key = [
      formatDate(player.installTimestamp),
      player.country,
      player.platform,
      player.channel,
      player.version
    ].join('__');
    const currentPlayers = cohortPlayers.get(key) ?? [];
    currentPlayers.push(player);
    cohortPlayers.set(key, currentPlayers);
  });

  return [...cohortPlayers.entries()]
    .map(([id, cohortMembers]) => {
      const firstPlayer = cohortMembers[0];
      const installDate = formatDate(firstPlayer.installTimestamp);
      const matureDays = Object.fromEntries(
        days.map((day) => [`d${day}`, isRetentionDayMature(firstPlayer.installTimestamp, day, observationEndTimestamp)])
      ) as Record<RetentionKey, boolean>;
      const retainedUsers = Object.fromEntries(
        days.map((day) => [
          `d${day}`,
          matureDays[`d${day}`] ? countRetainedUsers(cohortMembers, eventsByPlayer, day) : null
        ])
      ) as Record<RetentionKey, number | null>;
      const retention = Object.fromEntries(
        days.map((day) => {
          const retained = retainedUsers[`d${day}`];
          return [`d${day}`, retained === null ? null : ratio(retained, cohortMembers.length)];
        })
      ) as Record<RetentionKey, RetentionValue>;

      return {
        id,
        installDate,
        country: firstPlayer.country,
        platform: firstPlayer.platform,
        channel: firstPlayer.channel,
        version: firstPlayer.version,
        size: cohortMembers.length,
        retention,
        retainedUsers,
        matureDays
      };
    })
    .sort((left, right) => {
      if (left.installDate !== right.installDate) {
        return right.installDate.localeCompare(left.installDate);
      }
      return right.size - left.size;
    });
}

function countRetainedUsers(
  players: PlayerProfile[],
  eventsByPlayer: Map<string, GameEvent[]>,
  targetDay: number
): number {
  return players.filter((player) => {
    const installStart = startOfUtcDay(player.installTimestamp);
    const targetStart = installStart + targetDay * dayMs;
    const targetEnd = targetStart + dayMs;

    return (eventsByPlayer.get(player.id) ?? []).some(
      (event) =>
        event.eventName !== 'install' &&
        event.timestamp >= targetStart &&
        event.timestamp < targetEnd
    );
  }).length;
}

function groupEventsByPlayer(events: GameEvent[]): Map<string, GameEvent[]> {
  const eventMap = new Map<string, GameEvent[]>();
  events.forEach((event) => {
    const playerEvents = eventMap.get(event.playerId) ?? [];
    playerEvents.push(event);
    eventMap.set(event.playerId, playerEvents);
  });
  return eventMap;
}

function buildAverageRetention(
  cohorts: RetentionCohort[],
  days: number[]
): Record<RetentionKey, RetentionValue> {
  return Object.fromEntries(
    days.map((day) => {
      const matureCohorts = cohorts.filter((cohort) => cohort.matureDays[`d${day}`]);
      const retainedUsers = matureCohorts.reduce((sum, cohort) => sum + (cohort.retainedUsers[`d${day}`] ?? 0), 0);
      const cohortSize = matureCohorts.reduce((sum, cohort) => sum + cohort.size, 0);
      return [`d${day}`, cohortSize === 0 ? null : ratio(retainedUsers, cohortSize)];
    })
  ) as Record<RetentionKey, RetentionValue>;
}

function matchesFilters(
  value: Pick<PlayerProfile, 'country' | 'platform' | 'channel' | 'version'>,
  filters: GlobalFilters
): boolean {
  return (
    matchesFilter(value.country, filters.country) &&
    matchesFilter(value.platform, filters.platform) &&
    matchesFilter(value.channel, filters.channel) &&
    matchesFilter(value.version, filters.version)
  );
}

function matchesFilter(value: string, filter: string): boolean {
  return filter === 'all' || value === filter;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function isRetentionDayMature(
  installTimestamp: number,
  targetDay: number,
  observationEndTimestamp: number
): boolean {
  const installStart = startOfUtcDay(installTimestamp);
  const targetEnd = installStart + (targetDay + 1) * dayMs;

  return observationEndTimestamp >= targetEnd;
}

function resolveObservationEndTimestamp(players: PlayerProfile[], events: GameEvent[]): number {
  const latestTimestamp = Math.max(
    0,
    ...players.map((player) => player.installTimestamp),
    ...events.map((event) => event.timestamp)
  );

  return startOfUtcDay(latestTimestamp) + dayMs;
}

function startOfUtcDay(timestamp: number): number {
  const date = new Date(timestamp);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function ratio(numerator: number, denominator: number): number {
  if (denominator === 0) {
    return 0;
  }
  return Number((numerator / denominator).toFixed(4));
}
