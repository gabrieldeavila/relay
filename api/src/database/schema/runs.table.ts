import { index, jsonb, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import type { RunStatus } from '../../modules/engine/domain/run-status.js';
import { relay } from './relay-schema.js';
import { workflowVersions } from './workflow-versions.table.js';
import { workflows } from './workflows.table.js';

export const runs = relay.table(
  'runs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workflowId: uuid('workflow_id')
      .notNull()
      .references(() => workflows.id, { onDelete: 'cascade' }),
    versionId: uuid('version_id')
      .notNull()
      .references(() => workflowVersions.id),
    status: text('status').$type<RunStatus>().notNull().default('running'),
    triggerPayload: jsonb('trigger_payload').notNull().default({}),
    /** Secret in the links that resume waiting steps (`/resume/:token/...`). */
    resumeToken: text('resume_token').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
  },
  (table) => [index().on(table.workflowId, table.createdAt)],
);
