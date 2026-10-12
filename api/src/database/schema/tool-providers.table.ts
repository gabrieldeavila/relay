import {
  index,
  jsonb,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import type { ProviderKind } from '../../modules/providers/domain/provider-endpoint.js';
import type { ToolDescriptor } from '../../modules/providers/domain/tool-catalog.js';
import { relay } from './relay-schema.js';

/**
 * An app whose tools become nodes: Pincel's REST catalog (`GET <baseUrl>/api/tools`)
 * or an MCP server (by URL, or a local command). One per user and URL.
 */
export const toolProviders = relay.table(
  'tool_providers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id').notNull(),
    name: text('name').notNull(),
    kind: text('kind').$type<ProviderKind>().notNull().default('tools_api'),
    /** For `tools_api` and `mcp_http`. */
    baseUrl: text('base_url'),
    /** For `mcp_stdio`: the program and its arguments, never run through a shell. */
    command: jsonb('command').$type<{ command: string; args: string[] }>(),
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
