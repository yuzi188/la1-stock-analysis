import {
  getSnapshot,
  requestUserId,
  saveSnapshot,
  type AlertSettings,
  type CloudInvestmentNote,
  type CloudWatchItem,
} from "../../lib/server-store";

export async function GET(request: Request) {
  const userId = requestUserId(request);
  const snapshot = await getSnapshot(userId);
  return Response.json({ ok: true, snapshot });
}

export async function POST(request: Request) {
  const userId = requestUserId(request);
  const body = (await request.json().catch(() => ({}))) as {
    watchlist?: CloudWatchItem[];
    notes?: CloudInvestmentNote[];
    alertSettings?: Partial<AlertSettings>;
    readNotificationIds?: string[];
  };

  await saveSnapshot(userId, {
    watchlist: body.watchlist,
    notes: body.notes,
    alertSettings: body.alertSettings,
    readNotificationIds: body.readNotificationIds,
  });
  const snapshot = await getSnapshot(userId);

  return Response.json({ ok: true, snapshot });
}
