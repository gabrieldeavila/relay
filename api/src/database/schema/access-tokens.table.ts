import { index, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relay } from './relay-schema.js';

/**
 * Personal tokens other apps (Claude Code, Claude Desktop) use to reach
 * Relay over MCP. Only a hash is kept; the token is shown once.
 */
export const accessTokens = relay.table(
  'access_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id').notNull(),
    name: text('name').notNull(),
    /** SHA-256 of the token, hex. */
    tokenHash: text('token_hash').notNull().unique(),
    /** The first characters, so people can tell tokens apart. */
    hint: text('hint').notNull(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index().on(table.ownerId)],
);
