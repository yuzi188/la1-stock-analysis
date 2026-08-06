import { addNotification, requestUserId } from "../../lib/server-store";

type NotifyChannel = "telegram" | "line" | "email" | "webhook";

async function postJson(url: string, body: unknown, headers?: HeadersInit) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
  return { ok: response.ok, status: response.status };
}

async function sendTelegram(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { ok: false, skipped: true, reason: "missing_telegram_env" };

  return postJson(`https://api.telegram.org/bot${token}/sendMessage`, {
    chat_id: chatId,
    text: message,
  });
}

async function sendWebhook(channel: NotifyChannel, message: string) {
  const url =
    channel === "line"
      ? process.env.LINE_WEBHOOK_URL
      : channel === "email"
        ? process.env.EMAIL_WEBHOOK_URL
        : process.env.NOTIFY_WEBHOOK_URL;
  if (!url) return { ok: false, skipped: true, reason: `missing_${channel}_webhook_url` };

  return postJson(url, {
    text: message,
    message,
    source: "LA1台股分析室",
  });
}

export async function POST(request: Request) {
  const userId = requestUserId(request);
  const body = (await request.json().catch(() => ({}))) as {
    title?: string;
    detail?: string;
    tone?: "up" | "down" | "neutral" | "warn";
    channels?: NotifyChannel[];
  };
  const title = body.title?.trim() || "LA1 警報";
  const detail = body.detail?.trim() || "有新的市場提醒。";
  const message = `${title}\n${detail}`;
  const channels = body.channels?.length ? body.channels : (["telegram"] as NotifyChannel[]);

  const notification = await addNotification({
    userId,
    title,
    detail,
    tone: body.tone ?? "neutral",
    read: false,
  });

  const deliveries = await Promise.all(
    channels.map(async (channel) => ({
      channel,
      result: channel === "telegram" ? await sendTelegram(message) : await sendWebhook(channel, message),
    })),
  );

  return Response.json({ ok: true, notification, deliveries });
}
