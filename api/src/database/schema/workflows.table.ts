import { index, jsonb, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import type { WorkflowGraph } from '../../modules/workflows/domain/graph.js';
import { relay } from './relay-schema.js';

export const workflows = relay.table(
  'workflows',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Supabase Auth user id (`auth.users.id`). */
    ownerId: uuid('owner_id').notNull(),
    name: text('name').notNull(),
    draftGraph: jsonb('draft_graph')
      .$type<WorkflowGraph>()
      .notNull()
      .default({ nodes: [], edges: [] }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index().on(table.ownerId, table.updatedAt)],
);
