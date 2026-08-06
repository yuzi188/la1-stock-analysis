import { ensureUser, requestUserId } from "../../lib/server-store";

export async function GET(request: Request) {
  const user = await ensureUser(requestUserId(request));
  return Response.json({ ok: true, user });
}

export async function POST(request: Request) {
  const userId = requestUserId(request);
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    name?: string;
  };

  const user = await ensureUser(userId, {
    email: body.email || null,
    name: body.name || null,
  });

  return Response.json({ ok: true, user });
}
