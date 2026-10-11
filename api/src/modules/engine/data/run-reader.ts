import { Inject, Injectable } from '@nestjs/common';
import { asc, desc, eq, inArray } from 'drizzle-orm';
import { DATABASE, type Database } from '../../../database/database.js';
import {
  runs,
  stepAttempts,
  stepRuns,
} from '../../../database/schema/index.js';

/** Read side of runs for the API and the runs view. */
@Injectable()
export class RunReader {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  listForWorkflow(workflowId: string, limit = 50) {
    return this.db
      .select()
      .from(runs)
      .where(eq(runs.workflowId, workflowId))
      .orderBy(desc(runs.createdAt))
      .limit(limit);
  }

  /** The run with every step and each step's attempts; null if missing. */
  async get(runId: string) {
    const [run] = await this.db.select().from(runs).where(eq(runs.id, runId));
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
