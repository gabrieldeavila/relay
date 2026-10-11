import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray, lte } from 'drizzle-orm';
import {
  DATABASE,
  type Database,
  type Transaction,
} from '../../../database/database.js';
import { runs, stepRuns } from '../../../database/schema/index.js';
import { decideDeadline } from '../domain/decide-failure.js';
import { RunAdvancer } from './run-advancer.js';
import { VersionGraphs } from './version-graphs.js';

/** Ends event waits whose deadline passed: `timeout` port, or a failed run. */
@Injectable()
export class DeadlineSweeper {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly versions: VersionGraphs,
    private readonly advancer: RunAdvancer,
  ) {}

  /** Returns how many waits expired. */
  expireDue(limit = 20): Promise<number> {
    return this.db.transaction(async (tx) => {
      // No join here: Drizzle qualifies `FOR UPDATE OF` with the schema,
      // which Postgres rejects, so the run's version is read separately.
      const locked = await tx
        .select({
          id: stepRuns.id,
          runId: stepRuns.runId,
          nodeId: stepRuns.nodeId,
          attempt: stepRuns.attempt,
          deadlineAt: stepRuns.deadlineAt,
        })
        .from(stepRuns)
        .where(
          and(
            eq(stepRuns.status, 'waiting'),
            eq(stepRuns.waitingFor, 'event'),
            lte(stepRuns.deadlineAt, new Date()),
          ),
        )
        .limit(limit)
        .for('update', { skipLocked: true });
      const versionOf = await this.versionsOfRuns(
        tx,
        locked.map((step) => step.runId),
      );
      const due = locked.map((step) => ({
        ...step,
        versionId: versionOf.get(step.runId)!,
      }));

      for (const step of due) {
        const { index } = await this.versions.get(step.versionId);
        const ports = (index.outgoing.get(step.nodeId) ?? []).map(
          (edge) => edge.sourcePort,
        );
        await this.advancer.settleWaitingIn(
          tx,
          step,
          {
            ...decideDeadline(ports),
            error: {
              kind: 'timeout',
              message: 'No answer before the deadline',
            },
          },
          step.deadlineAt ?? new Date(),
        );
      }
      return due.length;
    });
  }

  private async versionsOfRuns(tx: Transaction, runIds: string[]) {
    if (runIds.length === 0) return new Map<string, string>();
    const rows = await tx
      .select({ id: runs.id, versionId: runs.versionId })
      .from(runs)
      .where(inArray(runs.id, runIds));
    return new Map(rows.map((row) => [row.id, row.versionId]));
  }
}
