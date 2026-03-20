/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
// Fetches the latest ounce price (USD) and asks Postgres to persist the snapshot
// and recalculate display prices using the current pricing settings.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const GOLD_PRICE_Z_KEY = Deno.env.get("GOLD_PRICE_Z_KEY") || "";
const CRON_SECRET = Deno.env.get("CRON_SECRET") || "";

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

async function fetchPricePerOunceUSD(): Promise<{ ounce: number; rawPayload: unknown }> {
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

  return {
    ounce,
    rawPayload: data,
  };
}

async function applyGoldPriceSnapshot(ouncePriceUsd: number, rawPayload: unknown) {
  const url = `${SUPABASE_URL}/rest/v1/rpc/apply_gold_price_snapshot`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_source_price_per_oz: round6(ouncePriceUsd),
      p_source: "goldpricez",
      p_raw_payload: rawPayload,
    }),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Failed to apply gold snapshot: ${resp.status} ${txt}`);
  }

  return resp.json();
}

Deno.serve(async (req: Request) => {
  try {
    validateEnv();

    if (req.method === "GET") {
      return jsonResponse({
        ok: true,
        function: "update-gold-prices",
        requires_secret: true,
        source: "goldpricez",
      });
    }

    if (req.method !== "POST") {
      return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
    }

    const incomingSecret = getSecretFromRequest(req);
    if (incomingSecret !== CRON_SECRET) {
      return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
    }

    const { ounce, rawPayload } = await retry(() => fetchPricePerOunceUSD(), 2, 300);
    const applied = await applyGoldPriceSnapshot(ounce, rawPayload);

    return jsonResponse({
      ok: true,
      ounce_price_usd: round6(ounce),
      source: "goldpricez",
      applied,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("update-gold-prices error:", message);
    return jsonResponse({ ok: false, error: message }, 500);
  }
});

