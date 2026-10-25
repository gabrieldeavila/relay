import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, isNotNull } from 'drizzle-orm';
import {
  DATABASE,
  type Database,
  type Transaction,
} from '../../../database/database.js';
import {
  runs,
  stepRuns,
  workflowVersions,
} from '../../../database/schema/index.js';
import { newSecretToken } from '../../../security/new-secret-token.js';
import {
  DEFAULT_PORT,
  type WorkflowGraph,
} from '../../workflows/domain/graph.js';
import { RunAdvancer } from './run-advancer.js';
import { VersionGraphs } from './version-graphs.js';

/** Starts runs of a workflow's latest published version, or tests of its draft. */
@Injectable()
export class RunStarter {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly versions: VersionGraphs,
    private readonly advancer: RunAdvancer,
  ) {}

  /** Null when the workflow was never published. */
  startRun(workflowId: string, payload: unknown): Promise<string | null> {
    return this.db.transaction((tx) =>
      this.startRunIn(tx, workflowId, payload),
    );
  }

  /** Same, inside the caller's transaction (a schedule fire commits both). */
  async startRunIn(
    tx: Transaction,
    workflowId: string,
    payload: unknown,
  ): Promise<string | null> {
    const [version] = await tx
      .select({ id: workflowVersions.id })
      .from(workflowVersions)
      .where(
        and(
          eq(workflowVersions.workflowId, workflowId),
          isNotNull(workflowVersions.version),
        ),
      )
      .orderBy(desc(workflowVersions.version))
      .limit(1);
    if (!version) return null;
    return this.startVersionIn(tx, workflowId, version.id, payload);
  }

  /**
   * Runs a snapshot of the draft without publishing it: no version number,
   * no trigger armed. Check that the graph is valid first.
   */
  startTestRun(
    workflowId: string,
    graph: WorkflowGraph,
    payload: unknown,
  ): Promise<string> {
    return this.db.transaction(async (tx) => {
      const [snapshot] = await tx
        .insert(workflowVersions)
        .values({ workflowId, version: null, graph })
        .returning({ id: workflowVersions.id });
      // Steps read graphs outside this transaction, before it commits.
      this.versions.remember(snapshot.id, graph);
      return this.startVersionIn(tx, workflowId, snapshot.id, payload);
    });
  }

  private async startVersionIn(
    tx: Transaction,
    workflowId: string,
    versionId: string,
    payload: unknown,
  ): Promise<string> {
    const { trigger } = await this.versions.get(versionId);
    const [run] = await tx
      .insert(runs)
      .values({
        workflowId,
        versionId,
        triggerPayload: payload,
        resumeToken: newSecretToken(),
      })
      .returning({ id: runs.id });
    await tx.insert(stepRuns).values({
      runId: run.id,
      nodeId: trigger.id,
      status: 'succeeded',
      port: DEFAULT_PORT,
      attempt: 1,
      input: payload,
      output: payload,
    });
    await this.advancer.advanceIn(tx, run.id, versionId);
    return run.id;
  }
}
