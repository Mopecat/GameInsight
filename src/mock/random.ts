export type RandomSource = () => number;

export function createSeededRandom(seed: string | number): RandomSource {
  let state = normalizeSeed(seed);

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickWeighted<T extends string>(
  random: RandomSource,
  entries: ReadonlyArray<readonly [T, number]>
): T {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let cursor = random() * total;

  for (const [value, weight] of entries) {
    cursor -= weight;
    if (cursor <= 0) {
      return value;
    }
  }

  return entries[entries.length - 1][0];
}

export function chance(random: RandomSource, probability: number): boolean {
  return random() < clamp(probability, 0, 1);
}

export function integerBetween(random: RandomSource, min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

export function floatBetween(random: RandomSource, min: number, max: number): number {
  return random() * (max - min) + min;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeSeed(seed: string | number): number {
  if (typeof seed === 'number') {
    return seed | 0;
  }

  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash | 0;
}
