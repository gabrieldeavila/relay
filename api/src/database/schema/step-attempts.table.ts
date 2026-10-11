import { integer, jsonb, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import type { StepError } from '../../modules/engine/domain/step-error.js';
import { relay } from './relay-schema.js';
import { stepRuns } from './step-runs.table.js';

export type AttemptOutcome =
  'succeeded' | 'failed' | 'retrying' | 'sleeping' | 'waiting' | 'timed_out';

/** History of every attempt, for the runs view. */
export const stepAttempts = relay.table('step_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  stepRunId: uuid('step_run_id')
    .notNull()
    .references(() => stepRuns.id, { onDelete: 'cascade' }),
  attempt: integer('attempt').notNull(),
  outcome: text('outcome').$type<AttemptOutcome>().notNull(),
  error: jsonb('error').$type<StepError>(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  finishedAt: timestamp('finished_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
