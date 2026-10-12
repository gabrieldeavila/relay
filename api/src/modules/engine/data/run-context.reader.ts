import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { DATABASE, type Database } from '../../../database/database.js';
import { runs, stepRuns } from '../../../database/schema/index.js';
import { publicUrl } from '../../../public-url.js';
import { uiUrl } from '../../../ui-url.js';
import type { ExpressionContext } from '../domain/expressions/resolve-expressions.js';

/** The run's links plus outputs and errors of settled steps, for `{{ }}`. */
@Injectable()
export class RunContextReader {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async read(runId: string, triggerNodeId: string): Promise<ExpressionContext> {
    const [run] = await this.db
      .select({ resumeToken: runs.resumeToken, workflowId: runs.workflowId })
      .from(runs)
      .where(eq(runs.id, runId));
    const rows = await this.db
      .select({
        nodeId: stepRuns.nodeId,
        output: stepRuns.output,
        error: stepRuns.error,
      })
      .from(stepRuns)
      .where(
        and(
          eq(stepRuns.runId, runId),
          inArray(stepRuns.status, ['succeeded', 'failed', 'timed_out']),
        ),
      );

    const steps = Object.fromEntries(
      rows.map(({ nodeId, output, error }) => [
        nodeId,
        error ? { output, error } : { output },
      ]),
    );
    return {
      trigger: steps[triggerNodeId]?.output ?? null,
      run: {
        id: runId,
        resumeUrl: `${publicUrl()}/resume/${run?.resumeToken}`,
        link: `${uiUrl()}/workflows/${run?.workflowId}/runs/${runId}`,
      },
      steps,
    };
  }
}
