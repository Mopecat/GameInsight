import { describe, expect, it } from 'vitest';

import { buildDashboardSnapshot } from './aggregations';
import type { GameEvent, GlobalFilters } from '../types/domain';

const allFilters: GlobalFilters = {
  country: 'all',
  platform: 'all',
  channel: 'all',
  version: 'all'
};

const startTimestamp = Date.UTC(2026, 3, 1);
const dayMs = 24 * 60 * 60 * 1000;

function event(overrides: Partial<GameEvent> & Pick<GameEvent, 'id' | 'playerId' | 'eventName'>): GameEvent {
  return {
    timestamp: startTimestamp,
    country: 'US',
    platform: 'ios',
    channel: 'facebook',
    version: '1.2.0',
    ...overrides
  };
}

describe('dashboard aggregations', () => {
  it('按当前筛选条件计算实时看板核心指标', () => {
    const events: GameEvent[] = [
      event({ id: 'e1', playerId: 'p1', eventName: 'install' }),
      event({ id: 'e2', playerId: 'p1', eventName: 'register' }),
      event({ id: 'e3', playerId: 'p1', eventName: 'payment', revenueUsd: 9.99 }),
      event({ id: 'e4', playerId: 'p2', eventName: 'install', platform: 'android', channel: 'google' }),
      event({ id: 'e5', playerId: 'p2', eventName: 'tutorial_complete', platform: 'android', channel: 'google' }),
      event({ id: 'e6', playerId: 'p3', eventName: 'install', country: 'JP', channel: 'organic' }),
      event({
        id: 'e7',
        playerId: 'p3',
        eventName: 'payment',
        country: 'JP',
        channel: 'organic',
        revenueUsd: 20
      })
    ];

    const allSnapshot = buildDashboardSnapshot(events, allFilters);
    const usSnapshot = buildDashboardSnapshot(events, { ...allFilters, country: 'US' });

    expect(allSnapshot.metrics.installs).toBe(3);
    expect(allSnapshot.metrics.registrations).toBe(1);
    expect(allSnapshot.metrics.tutorialCompletions).toBe(1);
    expect(allSnapshot.metrics.revenueUsd).toBe(29.99);
    expect(allSnapshot.metrics.payingUsers).toBe(2);
    expect(allSnapshot.metrics.arpuUsd).toBeCloseTo(10, 2);
    expect(allSnapshot.metrics.payRate).toBeCloseTo(0.6667, 4);

    expect(usSnapshot.metrics.installs).toBe(2);
    expect(usSnapshot.metrics.revenueUsd).toBe(9.99);
    expect(usSnapshot.metrics.payingUsers).toBe(1);
  });

  it('生成按日期补齐的安装、付费和收入趋势', () => {
    const events: GameEvent[] = [
      event({ id: 'e1', playerId: 'p1', eventName: 'install', timestamp: startTimestamp }),
      event({
        id: 'e2',
        playerId: 'p1',
        eventName: 'payment',
        timestamp: startTimestamp + 2 * 60 * 60 * 1000,
        revenueUsd: 5
      }),
      event({
        id: 'e3',
        playerId: 'p2',
        eventName: 'install',
        timestamp: startTimestamp + 2 * dayMs
      })
    ];

    const snapshot = buildDashboardSnapshot(events, allFilters, {
      startTimestamp,
      endTimestamp: startTimestamp + 3 * dayMs,
      days: 3
    });

    expect(snapshot.trend).toEqual([
      { date: '2026-04-01', installs: 1, payments: 1, revenueUsd: 5 },
      { date: '2026-04-02', installs: 0, payments: 0, revenueUsd: 0 },
      { date: '2026-04-03', installs: 1, payments: 0, revenueUsd: 0 }
    ]);
  });

  it('生成国家和渠道维度分布用于图表联动', () => {
    const events: GameEvent[] = [
      event({ id: 'e1', playerId: 'p1', eventName: 'install', country: 'US', channel: 'facebook' }),
      event({
        id: 'e2',
        playerId: 'p1',
        eventName: 'payment',
        country: 'US',
        channel: 'facebook',
        revenueUsd: 12
      }),
      event({ id: 'e3', playerId: 'p2', eventName: 'install', country: 'JP', channel: 'organic' }),
      event({
        id: 'e4',
        playerId: 'p2',
        eventName: 'payment',
        country: 'JP',
        channel: 'organic',
        revenueUsd: 30
      }),
      event({ id: 'e5', playerId: 'p3', eventName: 'install', country: 'JP', channel: 'organic' })
    ];

    const snapshot = buildDashboardSnapshot(events, allFilters);

    expect(snapshot.countryDistribution[0]).toMatchObject({
      key: 'JP',
      label: '日本',
      installs: 2,
      revenueUsd: 30
    });
    expect(snapshot.channelDistribution[0]).toMatchObject({
      key: 'organic',
      label: '自然量',
      installs: 2,
      revenueUsd: 30
    });
  });
});
