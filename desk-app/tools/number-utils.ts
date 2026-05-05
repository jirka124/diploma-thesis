export function clamp(min: number, value: number, max: number) {
  const low = Math.min(min, max);
  const high = Math.max(min, max);
  return Math.max(low, Math.min(high, value));
}

export function clamp01(value: number) {
  return clamp(0, value, 1);
}

export function clamp100(value: number) {
  return clamp(0, value, 100);
}

export function toNonNegativeInt(value: unknown, fallback = 0) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.round(value));
}
