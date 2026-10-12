import { bigint, primaryKey, text, uuid } from 'drizzle-orm/pg-core';
import { relay } from './relay-schema.js';
import { workflows } from './workflows.table.js';

/** Files a folder trigger already handled, so each one starts one run. */
export const seenFiles = relay.table(
  'seen_files',
  {
    workflowId: uuid('workflow_id')
      .notNull()
      .references(() => workflows.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    /** A file written again (new modified time) starts another run. */
    modifiedMs: bigint('modified_ms', { mode: 'number' }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.workflowId, table.name] })],
);
