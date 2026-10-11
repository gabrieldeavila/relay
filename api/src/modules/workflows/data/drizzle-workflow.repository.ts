import { Inject, Injectable } from '@nestjs/common';
import { desc, eq, max, sql } from 'drizzle-orm';
import { DATABASE, type Database } from '../../../database/database.js';
import { workflows, workflowVersions } from '../../../database/schema/index.js';
import type { WorkflowGraph } from '../domain/graph.js';
import type {
  Workflow,
  WorkflowChanges,
  WorkflowRepository,
  WorkflowSummary,
} from '../domain/workflow.js';

const latestVersion = sql<number | null>`(
  SELECT max(${workflowVersions.version}) FROM ${workflowVersions}
  WHERE ${workflowVersions.workflowId} = ${workflows.id}
)`;

const summaryColumns = {
  id: workflows.id,
  name: workflows.name,
  latestVersion,
  createdAt: workflows.createdAt,
  updatedAt: workflows.updatedAt,
};

@Injectable()
export class DrizzleWorkflowRepository implements WorkflowRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async create(name: string): Promise<Workflow> {
    const [row] = await this.db.insert(workflows).values({ name }).returning();
    return { ...row, latestVersion: null };
  }

  list(): Promise<WorkflowSummary[]> {
    return this.db
      .select(summaryColumns)
      .from(workflows)
      .orderBy(desc(workflows.updatedAt));
  }

  async find(id: string): Promise<Workflow | null> {
    const [row] = await this.db
      .select({ ...summaryColumns, draftGraph: workflows.draftGraph })
      .from(workflows)
      .where(eq(workflows.id, id));
    return row ?? null;
  }

  async update(id: string, changes: WorkflowChanges): Promise<Workflow | null> {
    const updated = await this.db
      .update(workflows)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(workflows.id, id))
      .returning({ id: workflows.id });
    return updated.length ? this.find(id) : null;
  }

  /** Locks the workflow row so concurrent publishes get distinct numbers. */
  addVersion(id: string, graph: WorkflowGraph): Promise<number> {
    return this.db.transaction(async (tx) => {
      await tx
        .select({ id: workflows.id })
        .from(workflows)
        .where(eq(workflows.id, id))
        .for('update');
      const [{ current }] = await tx
        .select({ current: max(workflowVersions.version) })
        .from(workflowVersions)
        .where(eq(workflowVersions.workflowId, id));
      const version = (current ?? 0) + 1;
      await tx
        .insert(workflowVersions)
        .values({ workflowId: id, version, graph });
      return version;
    });
  }
}
