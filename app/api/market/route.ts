import { getOfficialMarketSummary } from "../../lib/market";

function errorResponse(error: unknown) {
  const err = error as { message?: string; code?: string; status?: number };
  return Response.json(
    {
      ok: false,
      error: err.message ?? "官方市場資料暫時無法回應。",
      code: err.code ?? "market_summary_error",
    },
    { status: err.status ?? 500 },
  );
}

export async function GET() {
  try {
    const summary = await getOfficialMarketSummary();
    return Response.json({ ok: true, summary });
  } catch (error) {
    return errorResponse(error);
  }
}
