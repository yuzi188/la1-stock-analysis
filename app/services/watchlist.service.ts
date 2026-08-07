import { apiFetch } from "./api-client";

export function pullCloudSnapshot<T>(userId: string) {
  return apiFetch<T>("/api/sync", {
    headers: { "x-la1-user-id": userId },
  });
}

export function pushCloudSnapshot<T>(
  userId: string,
  snapshot: {
    watchlist: unknown;
    notes: unknown;
    alertSettings: unknown;
    readNotificationIds: unknown;
  },
) {
  return apiFetch<T>("/api/sync", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-la1-user-id": userId,
    },
    body: JSON.stringify(snapshot),
  });
}

export function runWatchlistScan<T>(
  userId: string,
  input: {
    symbols: string[];
    alertSettings: unknown;
  },
) {
  return apiFetch<T>("/api/scan", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-la1-user-id": userId,
    },
    body: JSON.stringify(input),
  });
}
