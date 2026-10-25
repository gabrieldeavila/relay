import { integer, jsonb, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import type { WorkflowGraph } from '../../modules/workflows/domain/graph.js';
import { relay } from './relay-schema.js';
import { workflows } from './workflows.table.js';

/**
 * Immutable snapshot of a draft; runs are pinned to one. Published versions
 * are numbered 1, 2, …; a test of the draft is stored without a number.
 */
export const workflowVersions = relay.table(
  'workflow_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workflowId: uuid('workflow_id')
      .notNull()
      .references(() => workflows.id, { onDelete: 'cascade' }),
    version: integer('version'),
    graph: jsonb('graph').$type<WorkflowGraph>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique().on(table.workflowId, table.version)],
);
