/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
// supabase/functions/update-gold-prices/main.ts
// Updates gold prices for 18K, 21K, 24K using global ounce price (USD).

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const GOLD_PRICE_Z_KEY = Deno.env.get("GOLD_PRICE_Z_KEY") || "";
const CRON_SECRET = Deno.env.get("CRON_SECRET") || "";
const MARKUP_PERCENT = Number.parseFloat(Deno.env.get("MARKUP_PERCENT") || "0");

const KARATS = [18, 21, 24] as const;
const GRAMS_PER_TROY_OUNCE = 31.1034768;

type KaratPrice = {
  karat: 18 | 21 | 24;
  buy: number;
  sell: number;
};

type HistoryRow = {
  karat: 18 | 21 | 24;
  buy: number;
  sell: number;
  price_per_gram: number;
  source_price_per_oz: number;
  currency: "USD";
  source: "goldpricez";
  created_at: string;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function round6(value: number): number {
  return Number(value.toFixed(6));
}

function getSecretFromRequest(req: Request): string {
  const direct = req.headers.get("x-cron-secret");
  if (direct) return direct;

  const auth = req.headers.get("authorization") || "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }

  return "";
}

function validateEnv() {
  if (!SUPABASE_URL) throw new Error("Missing SUPABASE_URL");
  if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  if (!GOLD_PRICE_Z_KEY) throw new Error("Missing GOLD_PRICE_Z_KEY");
  if (!CRON_SECRET) throw new Error("Missing CRON_SECRET");
}

async function retry<T>(fn: () => Promise<T>, attempts = 2, delayMs = 300): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const backoff = delayMs * Math.pow(2, i);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  throw lastErr;
}

async function fetchPricePerOunceUSD(): Promise<number> {
  const resp = await fetch("https://goldpricez.com/api/rates/currency/usd/measure/all", {
    headers: {
      "X-API-KEY": GOLD_PRICE_Z_KEY,
      "Content-Type": "application/json",
    },
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Goldpricez API error ${resp.status}: ${txt}`);
  }

  const raw = await resp.json();
  const data = typeof raw === "string" ? JSON.parse(raw) : raw;
  const ounceRaw = data?.ounce_price_usd;
  const ounce =
    typeof ounceRaw === "number"
      ? ounceRaw
      : typeof ounceRaw === "string"
        ? Number.parseFloat(ounceRaw)
        : Number.NaN;

  if (typeof ounce !== "number" || !Number.isFinite(ounce) || ounce <= 0) {
    throw new Error("Invalid ounce price from goldpricez");
  }

  return ounce;
}

function buildPrices(pricePerOunce: number): {
  prices: KaratPrice[];
  history: HistoryRow[];
} {
  const pure24Gram = pricePerOunce / GRAMS_PER_TROY_OUNCE;
  const now = new Date().toISOString();

  const prices: KaratPrice[] = [];
  const history: HistoryRow[] = [];

  for (const karat of KARATS) {
    const purity = karat / 24;
    const base = pure24Gram * purity;

    const buy = round6(base * (1 - MARKUP_PERCENT));
    const sell = round6(base * (1 + MARKUP_PERCENT));

    prices.push({ karat, buy, sell });

    history.push({
      karat,
      buy,
      sell,
      price_per_gram: round6(base),
      source_price_per_oz: round6(pricePerOunce),
      currency: "USD",
      source: "goldpricez",
      created_at: now,
    });
  }

  return { prices, history };
}

async function upsertPrices(prices: KaratPrice[]) {
  const url = `${SUPABASE_URL}/rest/v1/prices?on_conflict=karat`;

  const payload = prices.map((p) => ({
    karat: p.karat,
    buy: p.buy,
    sell: p.sell,
    updated_at: new Date().toISOString(),
  }));

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Failed to upsert prices: ${resp.status} ${txt}`);
  }

  return resp.json();
}

async function insertHistory(historyRows: HistoryRow[]) {
  const url = `${SUPABASE_URL}/rest/v1/price_history`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(historyRows),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Failed to insert price_history: ${resp.status} ${txt}`);
  }
}

Deno.serve(async (req: Request) => {
  try {
    validateEnv();

    if (req.method === "GET") {
      return jsonResponse({
        ok: true,
        function: "update-gold-prices",
        karats: KARATS,
        requires_secret: true,
      });
    }

    if (req.method !== "POST") {
      return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
    }

    const incomingSecret = getSecretFromRequest(req);
    if (incomingSecret !== CRON_SECRET) {
      return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
    }

    const ouncePrice = await retry(() => fetchPricePerOunceUSD(), 2, 300);
    const { prices, history } = buildPrices(ouncePrice);

    const upserted = await upsertPrices(prices);

    let historyInserted = true;
    let historyWarning = "";
    try {
      await insertHistory(history);
    } catch (err) {
      historyInserted = false;
      historyWarning = err instanceof Error ? err.message : String(err);
      console.error("price_history insert warning:", historyWarning);
    }

    return jsonResponse({
      ok: true,
      ounce_price_usd: round6(ouncePrice),
      markup_percent: MARKUP_PERCENT,
      prices,
      upserted,
      history_inserted: historyInserted,
      history_warning: historyWarning || null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("update-gold-prices error:", message);
    return jsonResponse({ ok: false, error: message }, 500);
  }
});

