import { describe, expect, it } from 'vitest';
import { ensureDisplaySpread } from '../utils/displayPricing';

describe('ensureDisplaySpread', () => {
  it('keeps sell slightly above buy when prices are equal', () => {
    const result = ensureDisplaySpread(100, 100);

    expect(result.buy).toBe(100);
    expect(result.sell).toBeCloseTo(100.3, 6);
  });

  it('keeps sell unchanged when it is already above the minimum premium', () => {
    const result = ensureDisplaySpread(100, 101);

    expect(result.buy).toBe(100);
    expect(result.sell).toBe(101);
  });

  it('returns the original nullable values when buy or sell is missing', () => {
    expect(ensureDisplaySpread(null, 101)).toEqual({ buy: null, sell: 101 });
    expect(ensureDisplaySpread(100, null)).toEqual({ buy: 100, sell: null });
  });
});
