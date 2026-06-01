import { buildRetentionAnalysis } from '../utils/retention';
import type { GameEvent, GlobalFilters, PlayerProfile } from '../types/domain';

export interface RetentionWorkerRequest {
  players: PlayerProfile[];
  events: GameEvent[];
  filters: GlobalFilters;
  days: number[];
  observationEndTimestamp?: number;
}

self.onmessage = (message: MessageEvent<RetentionWorkerRequest>) => {
  const startedAt = performance.now();
  const analysis = buildRetentionAnalysis(
    message.data.players,
    message.data.events,
    message.data.filters,
    message.data.days,
    message.data.observationEndTimestamp
  );
  const elapsedMs = performance.now() - startedAt;

  self.postMessage({
    analysis,
    elapsedMs
  });
};
