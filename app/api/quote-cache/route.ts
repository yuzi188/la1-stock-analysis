import { cleanSymbol, getFugleQuote } from "../../lib/market";
import { getCachedQuote, saveCachedQuote } from "../../lib/server-store";

const DEFAULT_QUOTE_TTL_MS = 60_000;

function ttlFromRequest(request: Request) {
  const value = Number(new URL(request.url).searchParams.get("ttlMs"));
  if (!Number.isFinite(value)) return DEFAULT_QUOTE_TTL_MS;
  return Math.min(Math.max(value, 15_000), 300_000);
}

async function cachedQuote(symbol: string, ttlMs: number) {
  const cached = await getCachedQuote(symbol);
  if (cached) return { quote: cached, cache: "hit" };

  const quote = await getFugleQuote(symbol);
  await saveCachedQuote(symbol, quote, ttlMs);
  return { quote, cache: "miss" };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = cleanSymbol(searchParams.get("symbol"));
  if (!symbol) {
    return Response.json(
      { ok: false, error: "請提供股票代號。", code: "missing_symbol" },
      { status: 400 },
    );
  }

  try {
    const result = await cachedQuote(symbol, ttlFromRequest(request));
    return Response.json({ ok: true, ...result });
  } catch (error) {
    const err = error as { message?: string; code?: string; status?: number };
    return Response.json(
      {
        ok: false,
        error: err.message ?? "快取報價暫時無法使用。",
        code: err.code ?? "quote_cache_error",
      },
      { status: err.status ?? 500 },
    );
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { symbols?: string[] };
  const symbols = Array.from(
    new Set((body.symbols ?? []).map((symbol) => cleanSymbol(symbol)).filter(Boolean)),
  ).slice(0, 20);

  if (!symbols.length) {
    return Response.json(
      { ok: false, error: "請提供至少一檔股票代號。", code: "missing_symbols" },
      { status: 400 },
    );
  }

  const ttlMs = ttlFromRequest(request);
  const results = await Promise.allSettled(symbols.map((symbol) => cachedQuote(symbol, ttlMs)));

  return Response.json({
    ok: true,
    quotes: results.map((result, index) =>
      result.status === "fulfilled"
        ? { symbol: symbols[index], ok: true, ...result.value }
        : {
            symbol: symbols[index],
            ok: false,
            error: (result.reason as { message?: string })?.message ?? "報價失敗",
          },
    ),
  });
}
