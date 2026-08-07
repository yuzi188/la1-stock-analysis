import { apiFetch } from "./api-client";

export function sendNotification<T>(
  userId: string,
  notification: {
    title: string;
    detail: string;
    tone: "up" | "down" | "neutral" | "warn";
    channels: ("telegram" | "line" | "email" | "webhook")[];
  },
) {
  return apiFetch<T>("/api/notify", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-la1-user-id": userId,
    },
    body: JSON.stringify(notification),
  });
}
