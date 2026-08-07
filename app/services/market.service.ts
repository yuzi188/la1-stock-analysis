import { apiFetch } from "./api-client";

export function getMarketSummary<T>() {
  return apiFetch<T>("/api/market", { cache: "no-store" });
}

export function getGeopoliticalSituation<T>() {
  return apiFetch<T>("/api/geopolitics", { cache: "no-store" });
}
