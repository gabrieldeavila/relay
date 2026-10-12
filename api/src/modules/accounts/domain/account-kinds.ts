import { z } from 'zod';

/** Services a user signs in to once so their steps can deliver results. */
export const ACCOUNT_KINDS = ['email', 'telegram', 'ai'] as const;
export type AccountKind = (typeof ACCOUNT_KINDS)[number];

export const emailSettings = z.object({
  host: z.string().trim().min(1),
  port: z.coerce.number().int().min(1).max(65535).default(587),
  /** True for port 465 (TLS from the start); 587 upgrades with STARTTLS. */
  secure: z.boolean().default(false),
  user: z.string().trim().min(1),
  /** Sender shown to recipients; the user name when empty. */
  from: z.string().trim().optional(),
});

export const telegramSettings = z.object({
  /** Where messages go when a step names no chat (usually your own chat). */
  chatId: z.string().trim().optional(),
});

export const aiSettings = z.object({});

export const ACCOUNT_SETTINGS = {
  email: emailSettings,
  telegram: telegramSettings,
  ai: aiSettings,
} satisfies Record<AccountKind, z.ZodObject>;

export type AccountSettings = {
  [K in AccountKind]: z.infer<(typeof ACCOUNT_SETTINGS)[K]>;
};

/** Settings plus the secret (password, bot token, API key), ready to use. */
export interface AccountCredentials<K extends AccountKind = AccountKind> {
  settings: AccountSettings[K];
  secret: string;
}

export const isAccountKind = (value: string): value is AccountKind =>
  (ACCOUNT_KINDS as readonly string[]).includes(value);
