import { describe, expect, it } from 'vitest';
import {
  GRAMS_PER_TROY_OUNCE,
  calculateGramPrice,
  calculateKaratBuySellPrices,
  convertOunceToSar,
  convertUsdToSar,
} from './goldCalculator';

describe('goldCalculator', () => {
  it('converts USD amounts to SAR using the configured exchange rate', () => {
    expect(convertUsdToSar(10, 3.8)).toBe(38);
    expect(convertOunceToSar(2500, 3.8)).toBe(9500);
  });

  it('returns null for invalid conversion inputs', () => {
    expect(convertUsdToSar(null, 3.8)).toBeNull();
    expect(convertUsdToSar(10, 0)).toBeNull();
    expect(convertOunceToSar(undefined, 3.8)).toBeNull();
  });

  it('calculates gram price correctly for different karats', () => {
    const ounceUsd = 3100;
    const gram24Usd = ounceUsd / GRAMS_PER_TROY_OUNCE;
    const gram21Usd = gram24Usd * (21 / 24);

    const karat24 = calculateGramPrice(ounceUsd, 24, 3.8);
    const karat21 = calculateGramPrice(ounceUsd, 21, 3.8);

    expect(karat24.usd).toBeCloseTo(gram24Usd, 6);
    expect(karat24.sar).toBeCloseTo(gram24Usd * 3.8, 6);
    expect(karat21.usd).toBeCloseTo(gram21Usd, 6);
    expect(karat21.sar).toBeCloseTo(gram21Usd * 3.8, 6);
  });

  it('applies buy and sell margins to ounce-derived karat prices', () => {
    const [result] = calculateKaratBuySellPrices(3100, 3.8, 0.02, 0.03, [24]);
    const baseGramUsd = 3100 / GRAMS_PER_TROY_OUNCE;

    expect(result.karat).toBe(24);
    expect(result.buyUsd).toBeCloseTo(baseGramUsd * 0.98, 6);
    expect(result.sellUsd).toBeCloseTo(baseGramUsd * 1.03, 6);
    expect(result.buySar).toBeCloseTo(baseGramUsd * 0.98 * 3.8, 6);
    expect(result.sellSar).toBeCloseTo(baseGramUsd * 1.03 * 3.8, 6);
    expect(result.sellUsd).toBeGreaterThan(result.buyUsd as number);
  });
});
