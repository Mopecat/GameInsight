import { describe, expect, it } from 'vitest';

import { buildRetentionAnalysis } from './retention';
import type { GameEvent, GlobalFilters, PlayerProfile } from '../types/domain';

const start = Date.UTC(2026, 3, 1);
const dayMs = 24 * 60 * 60 * 1000;
const allFilters: GlobalFilters = {
  country: 'all',
  platform: 'all',
  channel: 'all',
  version: 'all'
};

function player(id: string, installDay: number, country: PlayerProfile['country'] = 'US'): PlayerProfile {
  return {
    id,
    installTimestamp: start + installDay * dayMs,
    country,
    platform: 'ios',
    channel: 'facebook',
    version: '1.2.0',
    payerSegment: 'non_payer',
    acquisitionCostUsd: 1.2
  };
}

function event(
  id: string,
  playerId: string,
  eventName: GameEvent['eventName'],
  dayOffset: number,
  country: GameEvent['country'] = 'US'
): GameEvent {
  return {
    id,
    playerId,
    eventName,
    timestamp: start + dayOffset * dayMs + 60 * 60 * 1000,
    country,
    platform: 'ios',
    channel: 'facebook',
    version: '1.2.0',
    dayIndex: dayOffset
  };
}

describe('retention analysis', () => {
  it('按安装日期计算 D1、D3、D7 留存率', () => {
    const players = [player('p1', 0), player('p2', 0), player('p3', 0), player('p4', 1)];
    const events: GameEvent[] = [
      event('e1', 'p1', 'install', 0),
      event('e2', 'p2', 'install', 0),
      event('e3', 'p3', 'install', 0),
      event('e4', 'p4', 'install', 1),
      event('e5', 'p1', 'battle_start', 1),
      event('e6', 'p2', 'shop_view', 1),
      event('e7', 'p1', 'battle_start', 3),
      event('e8', 'p3', 'battle_start', 7)
    ];

    const analysis = buildRetentionAnalysis(players, events, allFilters, [1, 3, 7]);
    const firstCohort = analysis.cohorts.find((cohort) => cohort.installDate === '2026-04-01');

    expect(firstCohort).toMatchObject({
      installDate: '2026-04-01',
      size: 3,
      retention: {
        d1: 0.6667,
        d3: 0.3333,
        d7: 0.3333
      }
    });
    expect(analysis.heatmap).toContainEqual({
      installDate: '2026-04-01',
      day: 1,
      rate: 0.6667,
      retainedUsers: 2,
      cohortSize: 3
    });
  });

  it('按全局筛选条件过滤玩家和事件', () => {
    const players = [player('p1', 0, 'US'), player('p2', 0, 'JP')];
    const events: GameEvent[] = [
      event('e1', 'p1', 'install', 0, 'US'),
      event('e2', 'p2', 'install', 0, 'JP'),
      event('e3', 'p1', 'battle_start', 1, 'US'),
      event('e4', 'p2', 'battle_start', 1, 'JP')
    ];

    const analysis = buildRetentionAnalysis(players, events, { ...allFilters, country: 'JP' }, [1]);

    expect(analysis.summary.totalUsers).toBe(1);
    expect(analysis.summary.averageRetention.d1).toBe(1);
    expect(analysis.cohorts).toHaveLength(1);
    expect(analysis.cohorts[0].country).toBe('JP');
  });

  it('未满观察窗口的留存为空值，成熟但未回访仍为 0', () => {
    const players = [player('p1', 0), player('p2', 10)];
    const events: GameEvent[] = [
      event('e1', 'p1', 'install', 0),
      event('e2', 'p2', 'install', 10),
      event('e3', 'p1', 'battle_start', 1),
      event('e4', 'p2', 'battle_start', 11)
    ];

    const analysis = buildRetentionAnalysis(players, events, allFilters, [1, 30], start + 31 * dayMs);
    const matureCohort = analysis.cohorts.find((cohort) => cohort.installDate === '2026-04-01');
    const immatureCohort = analysis.cohorts.find((cohort) => cohort.installDate === '2026-04-11');

    expect(matureCohort?.retention.d1).toBe(1);
    expect(matureCohort?.retention.d30).toBe(0);
    expect(immatureCohort?.retention.d1).toBe(1);
    expect(immatureCohort?.retention.d30).toBeNull();
    expect(analysis.summary.averageRetention.d30).toBe(0);
  });
});
