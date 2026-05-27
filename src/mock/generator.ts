import { channelRules, countryRules, platformRules, versionRules } from './businessRules';
import { chance, clamp, createSeededRandom, floatBetween, integerBetween, pickWeighted } from './random';
import {
  channels,
  countries,
  platforms,
  versions,
  type Channel,
  type Country,
  type GameEvent,
  type GameEventName,
  type MockGameData,
  type PlayerProfile,
  type Platform,
  type Version
} from '../types/domain';

const dayMs = 24 * 60 * 60 * 1000;
const hourMs = 60 * 60 * 1000;

interface GenerateMockGameDataOptions {
  seed: string | number;
  playerCount: number;
  startDate: string;
  days: number;
}

interface GenerateRealtimeEventsOptions {
  seed: string | number;
  batchIndex: number;
  baseTimestamp: number;
  eventCount: number;
}

interface EventDraft {
  player: PlayerProfile;
  eventName: GameEventName;
  timestamp: number;
  dayIndex: number;
  revenueUsd?: number;
  sessionId?: string;
}

export function generateMockGameData(options: GenerateMockGameDataOptions): MockGameData {
  const random = createSeededRandom(options.seed);
  const startTimestamp = Date.parse(`${options.startDate}T00:00:00.000Z`);
  const endTimestamp = startTimestamp + options.days * dayMs;
  const players: PlayerProfile[] = [];
  const eventDrafts: EventDraft[] = [];

  for (let index = 0; index < options.playerCount; index += 1) {
    const player = createPlayerProfile(random, index, startTimestamp, options.days);
    players.push(player);
    eventDrafts.push(...createLifecycleEvents(random, player, startTimestamp, endTimestamp, options.days));
  }

  const events = materializeEvents(eventDrafts);

  return {
    players,
    events,
    range: {
      startTimestamp,
      endTimestamp,
      days: options.days
    },
    summary: buildSummary(players, events)
  };
}

export function generateRealtimeEvents(options: GenerateRealtimeEventsOptions): GameEvent[] {
  const random = createSeededRandom(`${options.seed}:${options.batchIndex}`);
  const events: GameEvent[] = [];

  for (let index = 0; index < options.eventCount; index += 1) {
    const country = pickCountry(random);
    const channel = pickChannel(random);
    const platform = pickPlatform(random);
    const version = pickVersion(random);
    const playerId = `rt-${options.batchIndex}-${index}-${country}-${channel}`;
    const timestamp = options.baseTimestamp + options.batchIndex * 15_000 + index * 900;
    const eventName = pickRealtimeEvent(random, index);
    const revenueUsd = eventName === 'payment' ? createPaymentAmount(random, country) : undefined;

    events.push({
      id: `rt_evt_${options.batchIndex}_${index}_${eventName}`,
      playerId,
      eventName,
      timestamp,
      country,
      platform,
      channel,
      version,
      revenueUsd,
      sessionId: `rt_s_${options.batchIndex}_${Math.floor(index / 4)}`,
      dayIndex: 0
    });
  }

  return events.sort((a, b) => a.timestamp - b.timestamp);
}

function createPlayerProfile(
  random: () => number,
  index: number,
  startTimestamp: number,
  days: number
): PlayerProfile {
  const country = pickCountry(random);
  const channel = pickChannel(random);
  const platform = pickPlatform(random);
  const version = pickVersion(random);
  const installOffset = integerBetween(random, 0, Math.max(0, days - 1)) * dayMs;
  const installTimestamp = startTimestamp + installOffset + integerBetween(random, 0, dayMs - 1);
  const payRate =
    countryRules[country].payRate * channelRules[channel].payLift * platformRules[platform].payLift;
  const payerSegment = chance(random, payRate)
    ? pickWeighted(random, [
        ['minnow', 72],
        ['dolphin', 23],
        ['whale', 5]
      ])
    : 'non_payer';

  return {
    id: `player_${String(index + 1).padStart(6, '0')}`,
    installTimestamp,
    country,
    platform,
    channel,
    version,
    payerSegment,
    acquisitionCostUsd: Number(channelRules[channel].acquisitionCostUsd.toFixed(2))
  };
}

function createLifecycleEvents(
  random: () => number,
  player: PlayerProfile,
  startTimestamp: number,
  endTimestamp: number,
  days: number
): EventDraft[] {
  const events: EventDraft[] = [
    {
      player,
      eventName: 'install',
      timestamp: player.installTimestamp,
      dayIndex: 0
    }
  ];
  const countryRule = countryRules[player.country];
  const channelRule = channelRules[player.channel];
  const versionRule = versionRules[player.version];
  const registerRate = countryRule.registerRate + channelRule.registerLift;
  const tutorialRate = countryRule.tutorialRate + channelRule.tutorialLift;
  const registered = chance(random, registerRate);

  if (!registered) {
    return events;
  }

  const registerTimestamp = player.installTimestamp + integerBetween(random, 2, 25) * 60_000;
  pushIfInRange(events, {
    player,
    eventName: 'register',
    timestamp: registerTimestamp,
    dayIndex: 0
  }, endTimestamp);

  const tutorialComplete = chance(random, tutorialRate);
  if (!tutorialComplete) {
    return events;
  }

  const tutorialTimestamp = registerTimestamp + integerBetween(random, 6, 45) * 60_000;
  pushIfInRange(events, {
    player,
    eventName: 'tutorial_complete',
    timestamp: tutorialTimestamp,
    dayIndex: 0
  }, endTimestamp);

  const firstBattleTimestamp = tutorialTimestamp + integerBetween(random, 3, 30) * 60_000;
  pushIfInRange(events, {
    player,
    eventName: 'battle_start',
    timestamp: firstBattleTimestamp,
    dayIndex: 0,
    sessionId: `${player.id}_s0`
  }, endTimestamp);

  if (chance(random, 0.58)) {
    const shopTimestamp = firstBattleTimestamp + integerBetween(random, 5, 60) * 60_000;
    pushIfInRange(events, {
      player,
      eventName: 'shop_view',
      timestamp: shopTimestamp,
      dayIndex: 0,
      sessionId: `${player.id}_s0`
    }, endTimestamp);

    if (chance(random, player.payerSegment === 'non_payer' ? 0.16 : 0.52)) {
      pushIfInRange(events, {
        player,
        eventName: 'gacha',
        timestamp: shopTimestamp + integerBetween(random, 1, 12) * 60_000,
        dayIndex: 0,
        sessionId: `${player.id}_s0`
      }, endTimestamp);
    }

    if (player.payerSegment !== 'non_payer' && chance(random, 0.68)) {
      pushIfInRange(events, {
        player,
        eventName: 'payment',
        timestamp: shopTimestamp + integerBetween(random, 2, 20) * 60_000,
        dayIndex: 0,
        revenueUsd: createPaymentAmount(random, player.country, player.payerSegment),
        sessionId: `${player.id}_s0`
      }, endTimestamp);
    }
  }

  const installDayIndex = Math.floor((player.installTimestamp - startTimestamp) / dayMs);
  const maxRelativeDay = Math.min(days - installDayIndex - 1, 30);

  for (let relativeDay = 1; relativeDay <= maxRelativeDay; relativeDay += 1) {
    const activeProbability = retentionProbability(relativeDay, countryRule.baseDay1Retention, versionRule.retentionLift);
    if (!chance(random, activeProbability)) {
      continue;
    }

    const dayStart = startTimestamp + (installDayIndex + relativeDay) * dayMs;
    const sessionTimestamp = dayStart + integerBetween(random, 8, 23) * hourMs + integerBetween(random, 0, 45) * 60_000;
    const sessionId = `${player.id}_s${relativeDay}`;
    const battleCount = integerBetween(random, 1, player.payerSegment === 'non_payer' ? 3 : 6);

    for (let battleIndex = 0; battleIndex < battleCount; battleIndex += 1) {
      pushIfInRange(events, {
        player,
        eventName: 'battle_start',
        timestamp: sessionTimestamp + battleIndex * integerBetween(random, 8, 20) * 60_000,
        dayIndex: relativeDay,
        sessionId
      }, endTimestamp);
    }

    if (chance(random, player.payerSegment === 'non_payer' ? 0.22 : 0.64)) {
      const shopTimestamp = sessionTimestamp + integerBetween(random, 15, 80) * 60_000;
      pushIfInRange(events, {
        player,
        eventName: 'shop_view',
        timestamp: shopTimestamp,
        dayIndex: relativeDay,
        sessionId
      }, endTimestamp);

      if (chance(random, player.payerSegment === 'non_payer' ? 0.08 : 0.42)) {
        pushIfInRange(events, {
          player,
          eventName: 'gacha',
          timestamp: shopTimestamp + integerBetween(random, 1, 10) * 60_000,
          dayIndex: relativeDay,
          sessionId
        }, endTimestamp);
      }

      if (player.payerSegment !== 'non_payer' && chance(random, paymentRepeatProbability(relativeDay, player.payerSegment))) {
        pushIfInRange(events, {
          player,
          eventName: 'payment',
          timestamp: shopTimestamp + integerBetween(random, 2, 18) * 60_000,
          dayIndex: relativeDay,
          revenueUsd: createPaymentAmount(random, player.country, player.payerSegment),
          sessionId
        }, endTimestamp);
      }
    }
  }

  return events.sort((a, b) => a.timestamp - b.timestamp);
}

function pushIfInRange(events: EventDraft[], event: EventDraft, endTimestamp: number): void {
  if (event.timestamp < endTimestamp) {
    events.push(event);
  }
}

function materializeEvents(drafts: EventDraft[]): GameEvent[] {
  return drafts
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((draft, index) => ({
      id: `evt_${String(index + 1).padStart(8, '0')}`,
      playerId: draft.player.id,
      eventName: draft.eventName,
      timestamp: draft.timestamp,
      country: draft.player.country,
      platform: draft.player.platform,
      channel: draft.player.channel,
      version: draft.player.version,
      revenueUsd: draft.revenueUsd,
      sessionId: draft.sessionId,
      dayIndex: draft.dayIndex
    }));
}

function buildSummary(players: PlayerProfile[], events: GameEvent[]): MockGameData['summary'] {
  return {
    paymentRateByCountry: countries.reduce(
      (summary, country) => ({
        ...summary,
        [country]: rate(
          uniquePlayers(events.filter((event) => event.country === country && event.eventName === 'payment')).size,
          players.filter((player) => player.country === country).length
        )
      }),
      {} as Record<Country, number>
    ),
    day1RetentionByCountry: countries.reduce(
      (summary, country) => ({
        ...summary,
        [country]: rate(
          uniquePlayers(events.filter((event) => event.country === country && event.dayIndex === 1)).size,
          players.filter((player) => player.country === country).length
        )
      }),
      {} as Record<Country, number>
    ),
    tutorialCompletionRateByChannel: channels.reduce(
      (summary, channel) => ({
        ...summary,
        [channel]: rate(
          uniquePlayers(events.filter((event) => event.channel === channel && event.eventName === 'tutorial_complete')).size,
          uniquePlayers(events.filter((event) => event.channel === channel && event.eventName === 'register')).size
        )
      }),
      {} as Record<Channel, number>
    )
  };
}

function uniquePlayers(events: GameEvent[]): Set<string> {
  return new Set(events.map((event) => event.playerId));
}

function rate(numerator: number, denominator: number): number {
  if (denominator === 0) {
    return 0;
  }

  return Number((numerator / denominator).toFixed(4));
}

function pickCountry(random: () => number): Country {
  return pickWeighted(
    random,
    countries.map((country) => [country, countryRules[country].installWeight] as const)
  );
}

function pickChannel(random: () => number): Channel {
  return pickWeighted(
    random,
    channels.map((channel) => [channel, channelRules[channel].installWeight] as const)
  );
}

function pickPlatform(random: () => number): Platform {
  return pickWeighted(
    random,
    platforms.map((platform) => [platform, platformRules[platform].installWeight] as const)
  );
}

function pickVersion(random: () => number): Version {
  return pickWeighted(
    random,
    versions.map((version) => [version, versionRules[version].installWeight] as const)
  );
}

function retentionProbability(relativeDay: number, day1Retention: number, versionLift: number): number {
  const decay = Math.pow(0.82, relativeDay - 1);
  return clamp(day1Retention * decay * versionLift, 0.02, 0.62);
}

function paymentRepeatProbability(relativeDay: number, segment: PlayerProfile['payerSegment']): number {
  const segmentBase = {
    non_payer: 0,
    minnow: 0.12,
    dolphin: 0.22,
    whale: 0.38
  }[segment];

  return clamp(segmentBase * Math.pow(0.96, relativeDay - 1), 0, 0.5);
}

function createPaymentAmount(
  random: () => number,
  country: Country,
  segment: PlayerProfile['payerSegment'] = 'minnow'
): number {
  const arppu = countryRules[country].arppuUsd;
  const segmentMultiplier = {
    non_payer: 0,
    minnow: 0.45,
    dolphin: 1.2,
    whale: 4.8
  }[segment];
  const amount = arppu * segmentMultiplier * floatBetween(random, 0.65, 1.45);

  return Number(Math.max(0.99, amount).toFixed(2));
}

function pickRealtimeEvent(random: () => number, index: number): GameEventName {
  if (index === 0) {
    return 'payment';
  }

  return pickWeighted(random, [
    ['battle_start', 34],
    ['shop_view', 20],
    ['gacha', 16],
    ['payment', 10],
    ['install', 9],
    ['register', 7],
    ['tutorial_complete', 4]
  ]);
}
