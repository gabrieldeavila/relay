import { apiRequest } from "@/app/api/api-request";

export type AccountKind = "email" | "telegram" | "ai";

/** Saved account as the API shows it: never the password, token or key. */
export interface Account {
  kind: AccountKind;
  settings: Record<string, unknown>;
  updatedAt: string;
}

export interface AccountCheck {
  ok: boolean;
  message: string;
}

export interface TelegramChat {
  id: string;
  name: string;
  type: string;
}

export const listAccounts = () => apiRequest<Account[]>("/accounts");

/** Without `secret` the stored one is kept. */
export const saveAccount = (
  kind: AccountKind,
  settings: Record<string, unknown>,
  secret?: string,
) =>
  apiRequest<Account>(`/accounts/${kind}`, {
    method: "PUT",
    body: { settings, ...(secret ? { secret } : {}) },
  });

export const removeAccount = (kind: AccountKind) =>
  apiRequest<null>(`/accounts/${kind}`, { method: "DELETE" });

export const checkAccount = (kind: AccountKind) =>
  apiRequest<AccountCheck>(`/accounts/${kind}/check`, { method: "POST" });

export const listTelegramChats = () =>
  apiRequest<TelegramChat[]>("/accounts/telegram/chats");
