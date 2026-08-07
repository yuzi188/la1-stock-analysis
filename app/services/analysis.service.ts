import { apiFetch } from "./api-client";

export function getStockAnalysis<T>(symbol: string) {
  return apiFetch<T>(`/api/analyze?symbol=${encodeURIComponent(symbol)}`, { cache: "no-store" });
}
