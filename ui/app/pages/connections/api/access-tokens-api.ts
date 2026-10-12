import { apiRequest } from "@/app/api/api-request";

export interface AccessToken {
  id: string;
  name: string;
  /** The first characters only; the token is shown once, when created. */
  hint: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface AccessTokens {
  mcpUrl: string;
  tokens: AccessToken[];
}

export const listAccessTokens = () =>
  apiRequest<AccessTokens>("/access-tokens");

export const createAccessToken = (name: string) =>
  apiRequest<AccessToken & { token: string }>("/access-tokens", {
    method: "POST",
    body: { name },
  });

export const revokeAccessToken = (id: string) =>
  apiRequest<null>(`/access-tokens/${id}`, { method: "DELETE" });
