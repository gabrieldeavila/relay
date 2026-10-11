import {
  index,
  integer,
  jsonb,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import type { StepError } from '../../modules/engine/domain/step-error.js';
import type { StepStatus } from '../../modules/engine/domain/step-status.js';
import type { WaitingFor } from '../../modules/engine/domain/step-change.js';
import { relay } from './relay-schema.js';
import { runs } from './runs.table.js';

/** One node of one run. Also the work queue: workers claim rows from here. */
export const stepRuns = relay.table(
  'step_runs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    runId: uuid('run_id')
      .notNull()
      .references(() => runs.id, { onDelete: 'cascade' }),
    nodeId: text('node_id').notNull(),
    status: text('status').$type<StepStatus>().notNull(),
    /** Output port followed when the step finished. */
    port: text('port'),
    attempt: integer('attempt').notNull().default(0),
    /** When a ready / retrying / sleeping step may be claimed. */
    runAt: timestamp('run_at', { withTimezone: true }).notNull().defaultNow(),
    /** For `waiting` steps: a timer (claimed at `run_at`) or an external event. */
    waitingFor: text('waiting_for').$type<WaitingFor>(),
    /** An event wait past this moment follows `timeout` (or fails the run). */
    deadlineAt: timestamp('deadline_at', { withTimezone: true }),
    /** A running step whose lease expired is reclaimed by the reaper. */
    leaseUntil: timestamp('lease_until', { withTimezone: true }),
    /** Config after expressions were resolved. */
    input: jsonb('input'),
    output: jsonb('output'),
    error: jsonb('error').$type<StepError>(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique().on(table.runId, table.nodeId),
    index().on(table.status, table.runAt),
    index().on(table.status, table.deadlineAt),
  ],
);
