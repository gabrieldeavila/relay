import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { DATABASE, type Database } from '../../../database/database.js';
import { runs, stepRuns } from '../../../database/schema/index.js';
import { retryableSteps } from '../domain/retryable-steps.js';
import { RunEvents } from './run-events.js';

/** "Try again from where it failed", inside the same run. */
@Injectable()
export class RunRetrier {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly events: RunEvents,
  ) {}

  /**
   * Puts the steps that failed the run back in the queue with fresh attempts
   * (their history is kept). False when the run is not a failed run.
   */
  retry(runId: string): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      const [run] = await tx
        .select({ status: runs.status })
        .from(runs)
        .where(eq(runs.id, runId))
        .for('update');
      if (run?.status !== 'failed') return false;

      const rows = await tx
        .select({
          nodeId: stepRuns.nodeId,
          status: stepRuns.status,
          port: stepRuns.port,
        })
        .from(stepRuns)
        .where(eq(stepRuns.runId, runId));
      const nodeIds = retryableSteps(
        new Map(
          rows.map((row) => [
            row.nodeId,
            { status: row.status, port: row.port ?? undefined },
          ]),
        ),
      );
      if (nodeIds.length === 0) return false;

      await tx
        .update(stepRuns)
        .set({
          status: 'ready',
          attempt: 0,
          port: null,
          error: null,
          waitingFor: null,
          deadlineAt: null,
          runAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(eq(stepRuns.runId, runId), inArray(stepRuns.nodeId, nodeIds)),
        );
      await tx
        .update(runs)
        .set({ status: 'running', finishedAt: null })
        .where(eq(runs.id, runId));
      await this.events.notify(tx, [runId]);
      return true;
    });
  }
}
