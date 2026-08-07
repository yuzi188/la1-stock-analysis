import { apiFetch } from "./api-client";

export function getStockContext<T>(symbol: string) {
  return apiFetch<T>(`/api/context?symbol=${encodeURIComponent(symbol)}`, { cache: "no-store" });
}

export function getCachedQuote<T>(symbol: string, ttlMs = 30_000) {
  const params = new URLSearchParams({ symbol, ttlMs: String(ttlMs) });
  return apiFetch<T>(`/api/quote-cache?${params}`, { cache: "no-store" });
}

export function getBatchCachedQuotes<T>(symbols: string[], ttlMs = 30_000) {
  return apiFetch<T>(`/api/quote-cache?ttlMs=${ttlMs}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ symbols }),
  });
}
