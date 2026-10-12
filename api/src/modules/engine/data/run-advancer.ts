import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import {
  DATABASE,
  type Database,
  type Transaction,
} from '../../../database/database.js';
import {
  runs,
  stepAttempts,
  stepRuns,
  type AttemptOutcome,
} from '../../../database/schema/index.js';
import { planAdvance } from '../domain/plan-advance.js';
import type { RunStatus } from '../domain/run-status.js';
import type { StepChange } from '../domain/step-change.js';
import { RunEvents } from './run-events.js';
import { stepChangeColumns } from './step-change-columns.js';
import type { ClaimedStep } from './step-queue.js';
import { VersionGraphs } from './version-graphs.js';

export const FINISHED_RUNS: RunStatus[] = ['succeeded', 'failed', 'cancelled'];

/** A step settled from outside a worker: an event or an expired deadline. */
export interface WaitingStep {
  id: string;
  runId: string;
  versionId: string;
  attempt: number;
}

/** Writes step results and moves runs forward, one transaction at a time. */
@Injectable()
export class RunAdvancer {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly versions: VersionGraphs,
    private readonly events: RunEvents,
  ) {}

  /**
   * Records the attempt only if this worker still holds the step (same status
   * and attempt); otherwise the result is dropped. Returns whether it was kept.
   */
  finish(step: ClaimedStep, change: StepChange, startedAt: Date) {
    return this.db.transaction(async (tx) => {
      const kept = await this.writeStep(
        tx,
        step,
        change,
        startedAt,
        and(eq(stepRuns.status, 'running'), eq(stepRuns.attempt, step.attempt)),
      );
      if (kept) await this.advanceIn(tx, step.runId, step.versionId);
      return kept;
    });
  }

  /** Settles an event wait, if it is still waiting. Caller owns the transaction. */
  async settleWaitingIn(
    tx: Transaction,
    step: WaitingStep,
    change: StepChange,
    startedAt: Date,
  ) {
    const kept = await this.writeStep(
      tx,
      step,
      change,
      startedAt,
      and(eq(stepRuns.status, 'waiting'), eq(stepRuns.waitingFor, 'event')),
    );
    if (kept) await this.advanceIn(tx, step.runId, step.versionId);
    return kept;
  }

  /**
   * Creates the steps that can start now and updates the run status. Locks
   * the run so two steps finishing together cannot both advance it.
   */
  async advanceIn(tx: Transaction, runId: string, versionId: string) {
    const [run] = await tx
      .select({ status: runs.status })
      .from(runs)
      .where(eq(runs.id, runId))
      .for('update');
    if (!run || FINISHED_RUNS.includes(run.status)) return;

    const rows = await tx
      .select({
        nodeId: stepRuns.nodeId,
        status: stepRuns.status,
        port: stepRuns.port,
      })
      .from(stepRuns)
      .where(eq(stepRuns.runId, runId));
    const { index } = await this.versions.get(versionId);
    const plan = planAdvance(
      index,
      new Map(
        rows.map(({ nodeId, status, port }) => [
          nodeId,
          { status, port: port ?? undefined },
        ]),
      ),
    );

    const created = [
      ...plan.ready.map((nodeId) => ({
        runId,
        nodeId,
        status: 'ready' as const,
      })),
      ...plan.skipped.map((nodeId) => ({
        runId,
        nodeId,
        status: 'skipped' as const,
      })),
    ];
    if (created.length) {
      await tx.insert(stepRuns).values(created).onConflictDoNothing();
    }
    await tx
      .update(runs)
      .set({
        status: plan.status,
        finishedAt: FINISHED_RUNS.includes(plan.status) ? new Date() : null,
      })
      .where(eq(runs.id, runId));
    await this.events.notify(tx, [runId]);
  }

  private async writeStep(
    tx: Transaction,
    step: { id: string; attempt: number },
    change: StepChange,
    startedAt: Date,
    fence: ReturnType<typeof and>,
  ) {
    const updated = await tx
      .update(stepRuns)
      .set({
        ...stepChangeColumns(change),
        leaseUntil: null,
        updatedAt: new Date(),
      })
      .where(and(eq(stepRuns.id, step.id), fence))
      .returning({ id: stepRuns.id });
    if (updated.length === 0) return false;

    await tx.insert(stepAttempts).values({
      stepRunId: step.id,
      attempt: step.attempt,
      outcome: attemptOutcome(change),
      error: 'error' in change ? change.error : null,
      startedAt,
    });
    return true;
  }
}

function attemptOutcome(change: StepChange): AttemptOutcome {
  if (change.status !== 'waiting') return change.status;
  return change.waitingFor === 'time' ? 'sleeping' : 'waiting';
}
