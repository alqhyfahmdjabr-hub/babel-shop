export const VISUAL_JITTER_PERCENT = 0.0008;

export const clampDisplayPair = (buy: number | null, sell: number | null) => {
  if (buy === null || sell === null) {
    return { buy, sell };
  }

  return {
    buy: Math.max(0, buy),
    sell: Math.max(sell, buy)
  };
};

export const nudgeDisplayValue = (
  base: number | null,
  percent = VISUAL_JITTER_PERCENT,
  randomFactor = Math.random() * 2 - 1
) => {
  if (base === null) return null;
  return Math.max(0, base + base * percent * randomFactor);
};

export const applyVisualJitterPair = (
  buy: number | null,
  sell: number | null,
  percent = VISUAL_JITTER_PERCENT,
  buyRandomFactor = Math.random() * 2 - 1,
  sellRandomFactor = Math.random() * 2 - 1
) =>
  clampDisplayPair(
    nudgeDisplayValue(buy, percent, buyRandomFactor),
    nudgeDisplayValue(sell, percent, sellRandomFactor)
  );
