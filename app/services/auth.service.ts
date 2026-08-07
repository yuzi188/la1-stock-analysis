import { apiFetch } from "./api-client";

export function authenticateByPhone<T>(input: { mode: "login" | "register"; phone: string; name?: string }) {
  return apiFetch<T>("/api/auth", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function saveUserProfile<T>(userId: string, profile: { email?: string; name?: string }) {
  return apiFetch<T>("/api/user", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-la1-user-id": userId,
    },
    body: JSON.stringify(profile),
  });
}
