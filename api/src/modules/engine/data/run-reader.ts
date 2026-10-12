import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { DATABASE, type Database } from '../../../database/database.js';
import {
  runs,
  stepAttempts,
  stepRuns,
  workflows,
} from '../../../database/schema/index.js';

/** Read side of runs for the API and the runs view, scoped to the owner. */
@Injectable()
export class RunReader {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async ownsWorkflow(workflowId: string, ownerId: string) {
    const [row] = await this.db
      .select({ id: workflows.id })
      .from(workflows)
      .where(and(eq(workflows.id, workflowId), eq(workflows.ownerId, ownerId)));
    return Boolean(row);
  }

  async listForWorkflow(workflowId: string, ownerId: string, limit = 50) {
    const rows = await this.db
      .select({ run: runs })
      .from(runs)
      .innerJoin(workflows, eq(workflows.id, runs.workflowId))
      .where(
        and(eq(runs.workflowId, workflowId), eq(workflows.ownerId, ownerId)),
      )
      .orderBy(desc(runs.createdAt))
      .limit(limit);
    return rows.map(({ run }) => run);
  }

  /** The run with every step and each step's attempts; null if missing. */
  async get(runId: string, ownerId: string) {
    const [row] = await this.db
      .select({ run: runs })
      .from(runs)
      .innerJoin(workflows, eq(workflows.id, runs.workflowId))
      .where(and(eq(runs.id, runId), eq(workflows.ownerId, ownerId)));
    const run = row?.run;
    if (!run) return null;

    const steps = await this.db
      .select()
      .from(stepRuns)
      .where(eq(stepRuns.runId, runId))
      .orderBy(asc(stepRuns.createdAt));
    const attempts = steps.length
      ? await this.db
          .select()
          .from(stepAttempts)
          .where(
            inArray(
              stepAttempts.stepRunId,
              steps.map((step) => step.id),
            ),
          )
          .orderBy(asc(stepAttempts.attempt))
      : [];

    return {
      ...run,
      steps: steps.map((step) => ({
        ...step,
        attempts: attempts.filter((attempt) => attempt.stepRunId === step.id),
      })),
    };
  }
}
