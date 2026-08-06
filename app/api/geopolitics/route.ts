import { getGeopoliticalSituation } from "../../lib/market";

function errorResponse(error: unknown) {
  const err = error as { message?: string; code?: string; status?: number };
  return Response.json(
    {
      ok: false,
      error: err.message ?? "Unable to load geopolitical situation data.",
      code: err.code ?? "geopolitics_error",
    },
    { status: err.status ?? 500 },
  );
}

export async function GET() {
  try {
    const situation = await getGeopoliticalSituation();
    return Response.json({ ok: true, situation });
  } catch (error) {
    return errorResponse(error);
  }
}
