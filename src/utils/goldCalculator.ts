export const GRAMS_PER_TROY_OUNCE = 31.1034768;
export const USD_TO_SAR = 3.8;

export type Karat = 18 | 21 | 24;

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
