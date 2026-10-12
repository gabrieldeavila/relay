import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { DATABASE, type Database } from '../../../database/database.js';
import { runs, stepRuns } from '../../../database/schema/index.js';
import type { StepStatus } from '../domain/step-status.js';
import { RunEvents } from './run-events.js';

const OPEN_STEPS: StepStatus[] = [
  'pending',
  'ready',
  'running',
  'retrying',
  'waiting',
];

@Injectable()
export class RunCanceller {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly events: RunEvents,
  ) {}

  /**
   * False when the run had already finished. A worker still running one of
   * its steps finishes the attempt, but its result is dropped.
   */
  cancelRun(runId: string): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      const cancelled = await tx
        .update(runs)
        .set({ status: 'cancelled', finishedAt: new Date() })
        .where(
          and(eq(runs.id, runId), inArray(runs.status, ['running', 'waiting'])),
        )
        .returning({ id: runs.id });
      if (cancelled.length === 0) return false;

      await tx
        .update(stepRuns)
        .set({ status: 'cancelled', leaseUntil: null, updatedAt: new Date() })
        .where(
          and(eq(stepRuns.runId, runId), inArray(stepRuns.status, OPEN_STEPS)),
        );
      await this.events.notify(tx, [runId]);
      return true;
    });
  }
}
