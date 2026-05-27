import { describe, expect, it } from 'vitest';

import { generateMockGameData, generateRealtimeEvents } from './generator';

describe('mock game data generator', () => {
  it('使用相同 seed 时生成完全一致的数据集', () => {
    const first = generateMockGameData({
      seed: 'stage-2-seed',
      playerCount: 120,
      startDate: '2026-04-01',
      days: 14
    });

    const second = generateMockGameData({
      seed: 'stage-2-seed',
      playerCount: 120,
      startDate: '2026-04-01',
      days: 14
    });

    expect(second).toEqual(first);
  });

  it('生成符合手游生命周期的玩家事件流', () => {
    const data = generateMockGameData({
      seed: 'lifecycle',
      playerCount: 300,
      startDate: '2026-04-01',
      days: 21
    });

    expect(data.players).toHaveLength(300);
    expect(data.events.length).toBeGreaterThan(300);

    const eventsByPlayer = new Map<string, typeof data.events>();
    data.events.forEach((event) => {
      const playerEvents = eventsByPlayer.get(event.playerId) ?? [];
      playerEvents.push(event);
      eventsByPlayer.set(event.playerId, playerEvents);

      expect(event.timestamp).toBeGreaterThanOrEqual(data.range.startTimestamp);
      expect(event.timestamp).toBeLessThan(data.range.endTimestamp);
      expect(event.country).toMatch(/US|JP|KR|BR|DE|TH/);
      expect(event.platform).toMatch(/ios|android/);
      expect(event.channel).toMatch(/facebook|google|tiktok|organic/);
    });

    data.players.forEach((player) => {
      const playerEvents = eventsByPlayer.get(player.id) ?? [];
      expect(playerEvents[0]?.eventName).toBe('install');
      expect(playerEvents.every((event) => event.playerId === player.id)).toBe(true);

      const timestamps = playerEvents.map((event) => event.timestamp);
      expect(timestamps).toEqual([...timestamps].sort((a, b) => a - b));

      const paymentEvents = playerEvents.filter((event) => event.eventName === 'payment');
      paymentEvents.forEach((event) => {
        expect(event.revenueUsd).toBeGreaterThan(0);
      });
    });
  });

  it('体现不同市场和渠道的业务差异', () => {
    const data = generateMockGameData({
      seed: 'market-difference',
      playerCount: 5000,
      startDate: '2026-04-01',
      days: 30
    });

    const paymentRateByCountry = data.summary.paymentRateByCountry;
    const retentionByCountry = data.summary.day1RetentionByCountry;
    const tutorialByChannel = data.summary.tutorialCompletionRateByChannel;

    expect(paymentRateByCountry.JP).toBeGreaterThan(paymentRateByCountry.BR);
    expect(paymentRateByCountry.US).toBeGreaterThan(paymentRateByCountry.TH);
    expect(retentionByCountry.JP).toBeGreaterThan(retentionByCountry.BR);
    expect(tutorialByChannel.organic).toBeGreaterThan(tutorialByChannel.facebook);
  });

  it('可以生成追加到实时看板的增量事件', () => {
    const batch = generateRealtimeEvents({
      seed: 'realtime',
      batchIndex: 3,
      baseTimestamp: Date.UTC(2026, 3, 1, 12, 0, 0),
      eventCount: 25
    });

    expect(batch).toHaveLength(25);
    expect(new Set(batch.map((event) => event.id)).size).toBe(25);
    expect(batch.every((event) => event.timestamp >= Date.UTC(2026, 3, 1, 12, 0, 0))).toBe(true);
    expect(batch.some((event) => event.eventName === 'payment')).toBe(true);
  });
});
