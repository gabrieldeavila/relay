import { jsonb, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import type { AccountKind } from '../../modules/accounts/domain/account-kinds.js';
import { relay } from './relay-schema.js';

/** A user's email, Telegram or AI account; one of each kind per user. */
export const accounts = relay.table(
  'accounts',
  {
    ownerId: uuid('owner_id').notNull(),
    kind: text('kind').$type<AccountKind>().notNull(),
    settings: jsonb('settings').$type<Record<string, unknown>>().notNull(),
    /** Password, bot token or API key, encrypted (see SecretBox). */
    secret: text('secret').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.ownerId, table.kind] })],
);
