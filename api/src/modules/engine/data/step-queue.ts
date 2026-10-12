import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DATABASE, type Database } from '../../../database/database.js';
import type { StepStatus } from '../domain/step-status.js';
import { RunEvents } from './run-events.js';

export interface ClaimedStep {
  id: string;
  runId: string;
  workflowId: string;
  versionId: string;
  nodeId: string;
  attempt: number;
  /** `waiting` means it woke up from a timer (a sleep). */
  previousStatus: StepStatus;
}

interface ClaimedRow extends Record<string, unknown> {
  id: string;
  run_id: string;
  workflow_id: string;
  version_id: string;
  node_id: string;
  attempt: number;
  previous_status: StepStatus;
}

/** The step_runs table seen as a work queue. */
@Injectable()
export class StepQueue {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly events: RunEvents,
  ) {}

  /**
   * Takes up to `limit` due steps and leases them. SKIP LOCKED lets many
   * workers claim at once without ever taking the same step twice.
   * Waking from a sleep does not count as a new attempt.
   */
  async claim(limit: number, leaseMs: number): Promise<ClaimedStep[]> {
    const rows = await this.db.execute<ClaimedRow>(sql`
      WITH picked AS (
        SELECT id, status AS previous_status
        FROM relay.step_runs
        WHERE (status IN ('ready', 'retrying')
               OR (status = 'waiting' AND waiting_for = 'time'))
          AND run_at <= now()
        ORDER BY run_at
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      )
      UPDATE relay.step_runs s
      SET status = 'running',
          attempt = s.attempt + CASE WHEN picked.previous_status = 'waiting' THEN 0 ELSE 1 END,
          lease_until = now() + make_interval(secs => ${leaseMs / 1000}),
          updated_at = now()
      FROM picked, relay.runs r
      WHERE s.id = picked.id AND r.id = s.run_id
      RETURNING s.id, s.run_id, r.workflow_id, r.version_id, s.node_id,
                s.attempt, picked.previous_status`);
    const claimed = rows.map(toClaimedStep);
    // Screens show the step as running right away.
    await this.events.notify(
      this.db,
      claimed.map((step) => step.runId),
    );
    return claimed;
  }

  /** False when the lease was lost (reclaimed by the reaper). */
  async renewLease(step: ClaimedStep, leaseMs: number): Promise<boolean> {
    const rows = await this.db.execute(sql`
      UPDATE relay.step_runs
      SET lease_until = now() + make_interval(secs => ${leaseMs / 1000})
      WHERE id = ${step.id} AND status = 'running' AND attempt = ${step.attempt}
      RETURNING id`);
    return rows.length > 0;
  }

  /** Steps whose worker died mid-attempt go back to the queue. */
  async reclaimExpired(): Promise<number> {
    const rows = await this.db.execute(sql`
      UPDATE relay.step_runs
      SET status = 'ready', lease_until = NULL, updated_at = now()
      WHERE status = 'running' AND lease_until < now()
      RETURNING id`);
    return rows.length;
  }
}

function toClaimedStep(row: ClaimedRow): ClaimedStep {
  return {
    id: row.id,
    runId: row.run_id,
    workflowId: row.workflow_id,
    versionId: row.version_id,
    nodeId: row.node_id,
    attempt: row.attempt,
    previousStatus: row.previous_status,
  };
}
