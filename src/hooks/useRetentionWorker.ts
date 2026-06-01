import { useEffect, useMemo, useState } from 'react';

import RetentionWorker from '../workers/retention.worker?worker';
import { buildRetentionAnalysis, type RetentionAnalysis } from '../utils/retention';
import type { GameEvent, GlobalFilters, PlayerProfile } from '../types/domain';

interface UseRetentionWorkerResult {
  analysis: RetentionAnalysis;
  elapsedMs: number;
  status: 'sync' | 'running' | 'done';
}

export function useRetentionWorker(
  players: PlayerProfile[],
  events: GameEvent[],
  filters: GlobalFilters,
  days: number[],
  observationEndTimestamp?: number
): UseRetentionWorkerResult {
  const fallbackAnalysis = useMemo(
    () => buildRetentionAnalysis(players, events, filters, days, observationEndTimestamp),
    [players, events, filters, days, observationEndTimestamp]
  );
  const [result, setResult] = useState<UseRetentionWorkerResult>({
    analysis: fallbackAnalysis,
    elapsedMs: 0,
    status: 'sync'
  });

  useEffect(() => {
    setResult({
      analysis: fallbackAnalysis,
      elapsedMs: 0,
      status: 'sync'
    });

    if (typeof Worker === 'undefined' || isTestRuntime()) {
      return undefined;
    }

    const worker = new RetentionWorker();
    setResult((current) => ({
      ...current,
      status: 'running'
    }));

    worker.onmessage = (
      message: MessageEvent<{
        analysis: RetentionAnalysis;
        elapsedMs: number;
      }>
    ) => {
      setResult({
        analysis: message.data.analysis,
        elapsedMs: message.data.elapsedMs,
        status: 'done'
      });
      worker.terminate();
    };

    worker.postMessage({
      players,
      events,
      filters,
      days,
      observationEndTimestamp
    });

    return () => {
      worker.terminate();
    };
  }, [days, events, fallbackAnalysis, filters, observationEndTimestamp, players]);

  return result;
}

function isTestRuntime(): boolean {
  return typeof navigator !== 'undefined' && navigator.userAgent.includes('jsdom');
}
