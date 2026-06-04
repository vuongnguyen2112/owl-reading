export function clampNumber(value: number, min: number, max: number): number {
  if (min > max) {
    throw new RangeError('min must be less than or equal to max');
  }

  return Math.min(Math.max(value, min), max);
}

export function toPositiveInteger(value: number, fallback: number): number {
  if (!Number.isInteger(value) || value < 1) {
    return fallback;
  }

  return value;
}
