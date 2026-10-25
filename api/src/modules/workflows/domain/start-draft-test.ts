import type { WorkflowGraph } from './graph.js';
import type { GraphIssue } from './graph-issue.js';
import type { FindNodeSpec } from './node-spec.js';
import { validateGraph } from './validate-graph.js';
import type { WorkflowRepository } from './workflow.js';

export type DraftTestResult =
  | { type: 'started'; runId: string }
  | { type: 'invalid'; issues: GraphIssue[] }
  | { type: 'not_found' };

/** Runs a frozen copy of the draft; returns the run id. */
export type StartTestRun = (
  workflowId: string,
  graph: WorkflowGraph,
  payload: unknown,
) => Promise<string>;

/**
 * Runs the current draft once, as it is, without publishing it: the version
 * number, the published flow and its trigger stay as they were.
 */
export class StartDraftTest {
  constructor(
    private readonly repository: WorkflowRepository,
    /** Built-in node types plus the tools of the owner's connected apps. */
    private readonly specsFor: (ownerId: string) => Promise<FindNodeSpec>,
    private readonly startTestRun: StartTestRun,
  ) {}

  async execute(
    workflowId: string,
    ownerId: string,
    payload: unknown,
  ): Promise<DraftTestResult> {
    const workflow = await this.repository.find(workflowId, ownerId);
    if (!workflow) return { type: 'not_found' };

    const issues = validateGraph(
      workflow.draftGraph,
      await this.specsFor(ownerId),
    );
    if (issues.length) return { type: 'invalid', issues };

    const runId = await this.startTestRun(
      workflowId,
      workflow.draftGraph,
      payload,
    );
    return { type: 'started', runId };
  }
}
