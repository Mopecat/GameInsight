import {
  channels,
  countries,
  type Channel,
  type Country,
  type GameEvent,
  type GlobalFilters,
  type MockDataRange
} from '../types/domain';

const dayMs = 24 * 60 * 60 * 1000;

const countryLabels: Record<Country, string> = {
  US: '美国',
  JP: '日本',
  KR: '韩国',
  BR: '巴西',
  DE: '德国',
  TH: '泰国'
};

const channelLabels: Record<Channel, string> = {
  facebook: 'Facebook',
  google: 'Google',
  tiktok: 'TikTok',
  organic: '自然量'
};

export interface DashboardMetrics {
  installs: number;
  registrations: number;
  tutorialCompletions: number;
  battles: number;
  revenueUsd: number;
  payingUsers: number;
  arpuUsd: number;
  payRate: number;
}

export interface DashboardTrendPoint {
  date: string;
  installs: number;
  payments: number;
  revenueUsd: number;
}

export interface DimensionBreakdown {
  key: string;
  label: string;
  installs: number;
  revenueUsd: number;
  payingUsers: number;
}

export interface DashboardSnapshot {
  metrics: DashboardMetrics;
  trend: DashboardTrendPoint[];
  countryDistribution: DimensionBreakdown[];
  channelDistribution: DimensionBreakdown[];
  filteredEvents: GameEvent[];
}

export function buildDashboardSnapshot(
  events: GameEvent[],
  filters: GlobalFilters,
  range?: MockDataRange
): DashboardSnapshot {
  const filteredEvents = events.filter((event) => matchesFilters(event, filters));

  return {
    metrics: buildMetrics(filteredEvents),
    trend: buildTrend(filteredEvents, range),
    countryDistribution: buildCountryDistribution(filteredEvents),
    channelDistribution: buildChannelDistribution(filteredEvents),
    filteredEvents
  };
}

function matchesFilters(event: GameEvent, filters: GlobalFilters): boolean {
  return (
    matchesFilter(event.country, filters.country) &&
    matchesFilter(event.platform, filters.platform) &&
    matchesFilter(event.channel, filters.channel) &&
    matchesFilter(event.version, filters.version)
  );
}

function matchesFilter(value: string, filter: string): boolean {
  return filter === 'all' || value === filter;
}

function buildMetrics(events: GameEvent[]): DashboardMetrics {
  const installs = countEvents(events, 'install');
  const revenueUsd = sumRevenue(events);
  const payingUsers = new Set(
    events.filter((event) => event.eventName === 'payment').map((event) => event.playerId)
  ).size;

  return {
    installs,
    registrations: countEvents(events, 'register'),
    tutorialCompletions: countEvents(events, 'tutorial_complete'),
    battles: countEvents(events, 'battle_start'),
    revenueUsd: roundCurrency(revenueUsd),
    payingUsers,
    arpuUsd: installs === 0 ? 0 : roundCurrency(revenueUsd / installs),
    payRate: installs === 0 ? 0 : roundRate(payingUsers / installs)
  };
}

function countEvents(events: GameEvent[], eventName: GameEvent['eventName']): number {
  return events.filter((event) => event.eventName === eventName).length;
}

function sumRevenue(events: GameEvent[]): number {
  return events.reduce((sum, event) => sum + (event.revenueUsd ?? 0), 0);
}

function buildTrend(events: GameEvent[], range?: MockDataRange): DashboardTrendPoint[] {
  const resolvedRange = range ?? inferRange(events);
  if (!resolvedRange) {
    return [];
  }

  const points = new Map<string, DashboardTrendPoint>();
  for (let index = 0; index < resolvedRange.days; index += 1) {
    const date = formatDate(resolvedRange.startTimestamp + index * dayMs);
    points.set(date, {
      date,
      installs: 0,
      payments: 0,
      revenueUsd: 0
    });
  }

  events.forEach((event) => {
    const date = formatDate(event.timestamp);
    const point = points.get(date);
    if (!point) {
      return;
    }

    if (event.eventName === 'install') {
      point.installs += 1;
    }
    if (event.eventName === 'payment') {
      point.payments += 1;
      point.revenueUsd = roundCurrency(point.revenueUsd + (event.revenueUsd ?? 0));
    }
  });

  return [...points.values()];
}

function inferRange(events: GameEvent[]): MockDataRange | null {
  if (events.length === 0) {
    return null;
  }

  const timestamps = events.map((event) => event.timestamp);
  const startTimestamp = startOfUtcDay(Math.min(...timestamps));
  const lastTimestamp = startOfUtcDay(Math.max(...timestamps));
  const days = Math.floor((lastTimestamp - startTimestamp) / dayMs) + 1;

  return {
    startTimestamp,
    endTimestamp: startTimestamp + days * dayMs,
    days
  };
}

function buildCountryDistribution(events: GameEvent[]): DimensionBreakdown[] {
  return countries
    .map((country) => buildDimensionBreakdown(country, countryLabels[country], events, (event) => event.country === country))
    .filter((item) => item.installs > 0 || item.revenueUsd > 0)
    .sort(compareDimensionBreakdown);
}

function buildChannelDistribution(events: GameEvent[]): DimensionBreakdown[] {
  return channels
    .map((channel) => buildDimensionBreakdown(channel, channelLabels[channel], events, (event) => event.channel === channel))
    .filter((item) => item.installs > 0 || item.revenueUsd > 0)
    .sort(compareDimensionBreakdown);
}

function buildDimensionBreakdown(
  key: string,
  label: string,
  events: GameEvent[],
  predicate: (event: GameEvent) => boolean
): DimensionBreakdown {
  const dimensionEvents = events.filter(predicate);

  return {
    key,
    label,
    installs: countEvents(dimensionEvents, 'install'),
    revenueUsd: roundCurrency(sumRevenue(dimensionEvents)),
    payingUsers: new Set(
      dimensionEvents.filter((event) => event.eventName === 'payment').map((event) => event.playerId)
    ).size
  };
}

function compareDimensionBreakdown(left: DimensionBreakdown, right: DimensionBreakdown): number {
  if (right.revenueUsd !== left.revenueUsd) {
    return right.revenueUsd - left.revenueUsd;
  }

  return right.installs - left.installs;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function startOfUtcDay(timestamp: number): number {
  const date = new Date(timestamp);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function roundCurrency(value: number): number {
  return Number(value.toFixed(2));
}

function roundRate(value: number): number {
  return Number(value.toFixed(4));
}
