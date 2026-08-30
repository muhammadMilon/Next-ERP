/**
 * Deterministic PRNG. Seed data must be identical on every load so the demo
 * reads like a real system of record rather than reshuffling on each render.
 */
export function makeRng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 0xffffffff;
  };
}

export type Rng = () => number;

export const pick = <T,>(rng: Rng, arr: readonly T[]): T => arr[Math.floor(rng() * arr.length) % arr.length];

export const between = (rng: Rng, min: number, max: number) => min + rng() * (max - min);

export const intBetween = (rng: Rng, min: number, max: number) => Math.floor(between(rng, min, max + 1));

export const chance = (rng: Rng, p: number) => rng() < p;

/** Stable string hash → used to seed per-page datasets from their slug. */
export const hashString = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

export const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36).slice(-5).toUpperCase()}${Math.floor(Math.random() * 900 + 100)}`;
