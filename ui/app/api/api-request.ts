import { accessToken, supabase } from "../auth/api/supabase-client";
import { ApiError } from "./api-error";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4400";

/** JSON call to the Relay API as the logged-in user. */
/** Headers for calls that cannot go through `apiRequest` (streams). */
export async function authHeaders(): Promise<Record<string, string>> {
  const token = await accessToken();
  return token ? { authorization: `Bearer ${token}` } : {};
}

export async function apiRequest<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const token = await accessToken();
  const response = await fetch(`${API_URL}${path}`, {
    method: init.method ?? "GET",
    headers: {
      ...(init.body === undefined ? {} : { "content-type": "application/json" }),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const body: unknown = await readJson(response);
  if (response.status === 401) await supabase.auth.signOut();
  if (!response.ok) throw new ApiError(response.status, body);
  return body as T;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
