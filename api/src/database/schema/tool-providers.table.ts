import {
  index,
  jsonb,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import type { ToolDescriptor } from '../../modules/providers/domain/tool-catalog.js';
import { relay } from './relay-schema.js';

/** An app whose tools (`GET <baseUrl>/api/tools`) become nodes; one per user and URL. */
export const toolProviders = relay.table(
  'tool_providers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id').notNull(),
    name: text('name').notNull(),
    baseUrl: text('base_url').notNull(),
    /** Catalog as last read from the app; refreshed on demand. */
    tools: jsonb('tools').$type<ToolDescriptor[]>().notNull(),
    refreshedAt: timestamp('refreshed_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique().on(table.ownerId, table.baseUrl),
    index().on(table.ownerId),
  ],
);
