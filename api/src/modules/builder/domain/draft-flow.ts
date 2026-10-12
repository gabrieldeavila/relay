import type { WorkflowGraph } from '../../workflows/domain/graph.js';
import { blockingIssues, type PlanIssue } from './check-plan.js';
import { describeIssue } from './describe-issue.js';
import type { FlowPlan } from './flow-plan.js';
import { readPlanAnswer } from './plan-answer.js';
import { planToGraph } from './plan-to-graph.js';

export const DRAFT_ROUNDS = 3;

export interface DraftDeps {
  /** One model turn: the first request (null) or the problems to fix. Answers JSON text. */
  ask(problems: string[] | null): Promise<string>;
  check(graph: WorkflowGraph): PlanIssue[];
}

export type DraftResult =
  | {
      ok: true;
      name: string;
      summary: string;
      plan: FlowPlan;
      graph: WorkflowGraph;
      /** What is left: blanks for the user, or problems the model could not fix. */
      issues: PlanIssue[];
    }
  | { ok: false; problems: string[] };

/**
 * Asks for a flow, checks it the way publishing would, and sends the
 * problems back until none block it or the rounds run out. The best draft
 * (fewest blocking problems) wins.
 */
export async function draftFlow(
  deps: DraftDeps,
  rounds = DRAFT_ROUNDS,
): Promise<DraftResult> {
  let best: Extract<DraftResult, { ok: true }> | null = null;
  let problems: string[] | null = null;

  for (let round = 0; round < rounds; round++) {
    const answer = readPlanAnswer(await deps.ask(problems));
    if (!answer.ok) {
      problems = answer.problems;
      continue;
    }
    const graph = planToGraph(answer.plan);
    const issues = deps.check(graph);
    const blocking = blockingIssues(issues);
    const { name, summary, plan } = answer;
    const draft = { ok: true as const, name, summary, plan, graph, issues };
    if (!best || blocking.length < blockingIssues(best.issues).length) {
      best = draft;
    }
    if (blocking.length === 0) return draft;
    problems = blocking.map(describeIssue);
  }
  return best ?? { ok: false, problems: problems ?? [] };
}
