import { Inject, Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
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
import { DEFAULT_PORT } from '../../workflows/domain/graph.js';
import { RunAdvancer } from './run-advancer.js';
import { VersionGraphs } from './version-graphs.js';

/** Starts runs of a workflow's latest published version. */
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
      .where(eq(workflowVersions.workflowId, workflowId))
      .orderBy(desc(workflowVersions.version))
      .limit(1);
    if (!version) return null;

    const { trigger } = await this.versions.get(version.id);
    const [run] = await tx
      .insert(runs)
      .values({
        workflowId,
        versionId: version.id,
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
    await this.advancer.advanceIn(tx, run.id, version.id);
    return run.id;
  }
}
