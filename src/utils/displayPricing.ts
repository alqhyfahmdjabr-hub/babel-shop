const DISPLAY_SELL_PREMIUM = 0.003;

export const ensureDisplaySpread = (buy: number | null, sell: number | null) => {
  if (buy === null || sell === null) {
    return { buy, sell };
  }

  return {
    buy,
    sell: Math.max(sell, buy * (1 + DISPLAY_SELL_PREMIUM))
  };
};
