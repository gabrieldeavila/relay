import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { DATABASE, type Database } from '../../../database/database.js';
import {
  runs,
  stepAttempts,
  stepRuns,
  workflowVersions,
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
      .select({ run: runs, version: workflowVersions.version })
      .from(runs)
      .innerJoin(workflows, eq(workflows.id, runs.workflowId))
      .innerJoin(workflowVersions, eq(workflowVersions.id, runs.versionId))
      .where(
        and(eq(runs.workflowId, workflowId), eq(workflows.ownerId, ownerId)),
      )
      .orderBy(desc(runs.createdAt))
      .limit(limit);
    return rows.map(({ run, version }) => ({ ...run, version }));
  }

  /**
   * The run with the graph of its version, every step and each step's
   * attempts in the order they ended (numbers restart after a manual
   * retry, and an expired wait starts at its deadline); null if missing.
   */
  async get(runId: string, ownerId: string) {
    const [row] = await this.db
      .select({
        run: runs,
        graph: workflowVersions.graph,
        version: workflowVersions.version,
      })
      .from(runs)
      .innerJoin(workflows, eq(workflows.id, runs.workflowId))
      .innerJoin(workflowVersions, eq(workflowVersions.id, runs.versionId))
      .where(and(eq(runs.id, runId), eq(workflows.ownerId, ownerId)));
    if (!row) return null;
    const { run, graph, version } = row;

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
          .orderBy(asc(stepAttempts.finishedAt), asc(stepAttempts.startedAt))
      : [];

    return {
      ...run,
      graph,
      version,
      steps: steps.map((step) => ({
        ...step,
        attempts: attempts.filter((attempt) => attempt.stepRunId === step.id),
      })),
    };
  }
}
