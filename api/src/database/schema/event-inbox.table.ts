import {
  index,
  jsonb,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { relay } from './relay-schema.js';
import { runs } from './runs.table.js';

/**
 * Events sent to waiting steps. Stored first, then consumed, so an event that
 * arrives before its step starts waiting is not lost. `dedupe_key` drops
 * repeated deliveries of the same event.
 */
export const eventInbox = relay.table(
  'event_inbox',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    runId: uuid('run_id')
      .notNull()
      .references(() => runs.id, { onDelete: 'cascade' }),
    nodeId: text('node_id').notNull(),
    /** e.g. `approve` / `reject`; null for plain webhooks. */
    action: text('action'),
    payload: jsonb('payload'),
    dedupeKey: text('dedupe_key').notNull(),
    receivedAt: timestamp('received_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
  },
  (table) => [
    unique().on(table.runId, table.nodeId, table.dedupeKey),
    index().on(table.runId, table.nodeId, table.consumedAt),
  ],
);
