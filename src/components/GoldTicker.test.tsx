import { describe, expect, it } from 'vitest';
import { applyVisualJitterPair, clampDisplayPair } from '../utils/displayPricing';

describe('displayPricing', () => {
  it('preserves the real order between buy and sell prices', () => {
    const result = clampDisplayPair(100, 99);

    expect(result.buy).toBe(100);
    expect(result.sell).toBe(100);
  });

  it('returns original nullable values when one side is missing', () => {
    expect(clampDisplayPair(null, 101)).toEqual({ buy: null, sell: 101 });
    expect(clampDisplayPair(100, null)).toEqual({ buy: 100, sell: null });
  });

  it('applies only visual jitter without breaking the displayed spread', () => {
    const result = applyVisualJitterPair(100, 101, 0.001, 1, -1);

    expect(result.buy).toBeCloseTo(100.1, 6);
    expect(result.sell).toBeGreaterThanOrEqual(result.buy as number);
  });
});
