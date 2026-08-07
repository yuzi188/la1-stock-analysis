export type ApiResult<T> = {
  response: Response;
  payload: T | null;
};

export async function apiFetch<T>(input: RequestInfo | URL, init?: RequestInit): Promise<ApiResult<T>> {
  const response = await fetch(input, init);
  const payload = (await response.json().catch(() => null)) as T | null;
  return { response, payload };
}
