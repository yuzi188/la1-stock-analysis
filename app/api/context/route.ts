import { cleanSymbol, getMarketContext } from "../../lib/market";

function errorResponse(error: unknown) {
  const err = error as { message?: string; code?: string; status?: number };
  return Response.json(
    {
      ok: false,
      error: err.message ?? "市場脈絡資料暫時無法使用。",
      code: err.code ?? "context_error",
    },
    { status: err.status ?? 500 },
  );
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
    const context = await getMarketContext(symbol);
    return Response.json({ ok: true, context });
  } catch (error) {
    return errorResponse(error);
  }
}
