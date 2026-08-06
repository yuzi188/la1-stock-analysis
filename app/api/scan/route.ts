import { cleanSymbol, getFugleQuote, type MarketQuote } from "../../lib/market";
import {
  addNotification,
  addScanRun,
  defaultAlertSettings,
  getCachedQuote,
  getSnapshot,
  requestUserId,
  saveCachedQuote,
  type AlertSettings,
} from "../../lib/server-store";

const SCAN_QUOTE_TTL_MS = 60_000;

function evaluateQuote(quote: MarketQuote, settings: AlertSettings) {
  const changePercent = quote.changePercent ?? 0;
  const alerts = [
    {
      id: "up",
      title: "上漲警報",
      active: changePercent >= settings.upPercent,
      detail: `${quote.name} ${quote.symbol} 漲幅 ${changePercent.toFixed(2)}%。`,
      tone: "up" as const,
    },
    {
      id: "down",
      title: "下跌警報",
      active: changePercent <= -settings.downPercent,
      detail: `${quote.name} ${quote.symbol} 跌幅 ${changePercent.toFixed(2)}%。`,
      tone: "down" as const,
    },
    {
      id: "breakout",
      title: "突破警報",
      active: Boolean(quote.price && quote.highPrice && quote.price >= quote.highPrice * (1 - settings.breakoutBuffer / 100)),
      detail: `${quote.name} ${quote.symbol} 現價接近日高 ${quote.highPrice ?? "--"}。`,
      tone: "up" as const,
    },
  ];

  return alerts.filter((alert) => alert.active);
}

async function cachedQuote(symbol: string) {
  const cached = await getCachedQuote(symbol);
  if (cached) return cached;

  const quote = await getFugleQuote(symbol);
  await saveCachedQuote(symbol, quote, SCAN_QUOTE_TTL_MS);
  return quote;
}

export async function POST(request: Request) {
  const userId = requestUserId(request);
  const snapshot = await getSnapshot(userId);
  const body = (await request.json().catch(() => ({}))) as {
    symbols?: string[];
    alertSettings?: Partial<AlertSettings>;
  };
  const settings = { ...defaultAlertSettings, ...snapshot.alertSettings, ...body.alertSettings };
  const symbols = Array.from(
    new Set(
      (body.symbols?.length ? body.symbols : snapshot.watchlist.map((item) => item.symbol))
        .map((symbol) => cleanSymbol(symbol))
        .filter(Boolean),
    ),
  ).slice(0, 20);

  if (!symbols.length) {
    return Response.json(
      { ok: false, error: "自選股名單是空的。", code: "empty_watchlist" },
      { status: 400 },
    );
  }

  const rows = await Promise.allSettled(
    symbols.map(async (symbol) => {
      const quote = await cachedQuote(symbol);
      const alerts = evaluateQuote(quote, settings);
      for (const alert of alerts) {
        await addNotification({
          userId,
          title: alert.title,
          detail: alert.detail,
          tone: alert.tone,
          read: false,
        });
      }
      return { symbol, quote, alerts };
    }),
  );

  const result = rows.map((row, index) =>
    row.status === "fulfilled"
      ? { ok: true, ...row.value }
      : {
          ok: false,
          symbol: symbols[index],
          error: (row.reason as { message?: string })?.message ?? "掃描失敗",
        },
  );
  const triggered = result.reduce(
    (count, row) => count + (row.ok && "alerts" in row ? row.alerts.length : 0),
    0,
  );
  const run = await addScanRun({ userId, symbols, triggered, result });

  return Response.json({ ok: true, run, result });
}
