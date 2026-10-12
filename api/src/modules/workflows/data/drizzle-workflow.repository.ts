import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, max, sql } from 'drizzle-orm';
import { DATABASE, type Database } from '../../../database/database.js';
import { workflows, workflowVersions } from '../../../database/schema/index.js';
import type { WorkflowGraph } from '../domain/graph.js';
import type {
  Workflow,
  WorkflowChanges,
  WorkflowRepository,
  WorkflowSummary,
} from '../domain/workflow.js';

// Written out in full: inside a select, Drizzle prints columns without their
// table, and an unqualified "id" here would match workflow_versions.id.
const latestVersion = sql<number | null>`(
  SELECT max(v.version) FROM relay.workflow_versions v
  WHERE v.workflow_id = "relay"."workflows"."id"
)`.mapWith((value) => (value === null ? null : Number(value)));

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

  async create(ownerId: string, name: string): Promise<Workflow> {
    const [row] = await this.db
      .insert(workflows)
      .values({ ownerId, name })
      .returning();
    return { ...row, latestVersion: null };
  }

  list(ownerId: string): Promise<WorkflowSummary[]> {
    return this.db
      .select(summaryColumns)
      .from(workflows)
      .where(eq(workflows.ownerId, ownerId))
      .orderBy(desc(workflows.updatedAt));
  }

  async find(id: string, ownerId: string): Promise<Workflow | null> {
    const [row] = await this.db
      .select({ ...summaryColumns, draftGraph: workflows.draftGraph })
      .from(workflows)
      .where(owned(id, ownerId));
    return row ?? null;
  }

  async update(
    id: string,
    ownerId: string,
    changes: WorkflowChanges,
  ): Promise<Workflow | null> {
    const updated = await this.db
      .update(workflows)
      .set({ ...changes, updatedAt: new Date() })
      .where(owned(id, ownerId))
      .returning({ id: workflows.id });
    return updated.length ? this.find(id, ownerId) : null;
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

const owned = (id: string, ownerId: string) =>
  and(eq(workflows.id, id), eq(workflows.ownerId, ownerId));
