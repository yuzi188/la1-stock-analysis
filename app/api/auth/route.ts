import { ensureUser } from "../../lib/server-store";

function cleanPhone(value: unknown) {
  const raw = String(value ?? "").trim();
  let digits = raw.replace(/\D/g, "");

  if (digits.startsWith("886") && digits.length >= 11) {
    digits = `0${digits.slice(3)}`;
  }

  return digits.slice(0, 15);
}

function maskedPhone(phone: string) {
  if (phone.length <= 6) return phone;
  return `${phone.slice(0, 4)}***${phone.slice(-3)}`;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    mode?: "login" | "register";
    phone?: string;
    name?: string;
  };
  const phone = cleanPhone(body.phone);

  if (phone.length < 8) {
    return Response.json(
      { ok: false, error: "Invalid phone number.", code: "invalid_phone" },
      { status: 400 },
    );
  }

  const userId = `phone-${phone}`;
  const name =
    body.mode === "register"
      ? String(body.name || `Mobile user ${phone.slice(-3)}`).slice(0, 40)
      : undefined;
  const user = await ensureUser(userId, name ? { name } : undefined);

  return Response.json({
    ok: true,
    user,
    phone: maskedPhone(phone),
    mode: body.mode === "register" ? "register" : "login",
  });
}
