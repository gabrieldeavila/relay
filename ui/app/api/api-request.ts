import { ApiError } from "./api-error";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4400";

/** JSON request to the Relay API (local, no login); GET unless `init` says otherwise. */
export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init);
  const body: unknown = await readJson(response);
  if (!response.ok) throw new ApiError(response.status, body);
  return body as T;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
