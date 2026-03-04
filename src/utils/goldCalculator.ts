export const GRAMS_PER_TROY_OUNCE = 31.1034768;
export const USD_TO_SAR = 3.8;
export const DEFAULT_KARATS: readonly Karat[] = [18, 21, 24];

export type Karat = 18 | 21 | 24;
export type PricingCalcMethod = 'db_prices' | 'from_ounce';

export interface KaratBuySellPrice {
  karat: Karat;
  buyUsd: number | null;
  sellUsd: number | null;
  buySar: number | null;
  sellSar: number | null;
}

const isPositiveFinite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

export const convertUsdToSar = (
  usdAmount: number | null | undefined,
  rate = USD_TO_SAR
): number | null => {
  if (!isPositiveFinite(usdAmount) || !isPositiveFinite(rate)) return null;
  return usdAmount * rate;
};

export const convertOunceToSar = (
  ounceUsd: number | null | undefined,
  rate = USD_TO_SAR
): number | null => convertUsdToSar(ounceUsd, rate);

export const calculateGramPrice = (
  ounceUsd: number | null | undefined,
  karat: Karat,
  exchangeRate = USD_TO_SAR
): { usd: number | null; sar: number | null } => {
  if (!isPositiveFinite(ounceUsd)) return { usd: null, sar: null };

  const gram24Usd = ounceUsd / GRAMS_PER_TROY_OUNCE;
  const gramKaratUsd = gram24Usd * (karat / 24);

  return {
    usd: gramKaratUsd,
    sar: convertUsdToSar(gramKaratUsd, exchangeRate)
  };
};

export const calculateKaratBuySellPrices = (
  ounceUsd: number | null | undefined,
  exchangeRate = USD_TO_SAR,
  buyMarginPercent = 0,
  sellMarginPercent = 0,
  karats: readonly Karat[] = DEFAULT_KARATS
): KaratBuySellPrice[] => {
  const buyMargin = Number.isFinite(buyMarginPercent) ? Math.max(0, buyMarginPercent) : 0;
  const sellMargin = Number.isFinite(sellMarginPercent) ? Math.max(0, sellMarginPercent) : 0;

  return karats.map((karat) => {
    const gram = calculateGramPrice(ounceUsd, karat, exchangeRate);
    if (gram.usd === null) {
      return {
        karat,
        buyUsd: null,
        sellUsd: null,
        buySar: null,
        sellSar: null
      };
    }

    const buyUsd = gram.usd * (1 - buyMargin);
    const sellUsd = gram.usd * (1 + sellMargin);

    return {
      karat,
      buyUsd,
      sellUsd,
      buySar: convertUsdToSar(buyUsd, exchangeRate),
      sellSar: convertUsdToSar(sellUsd, exchangeRate)
    };
  });
};
