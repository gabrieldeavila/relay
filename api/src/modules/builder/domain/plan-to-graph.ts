import {
  DEFAULT_PORT,
  type WorkflowGraph,
} from '../../workflows/domain/graph.js';
import type { FlowPlan } from './flow-plan.js';
import { layoutSteps } from './layout-steps.js';

/**
 * The plan as a draft graph. Steps already on the canvas (same id) keep the
 * place the user gave them; new ones are laid out left to right.
 */
export function planToGraph(
  plan: FlowPlan,
  previous?: WorkflowGraph,
): WorkflowGraph {
  const placed = new Map(previous?.nodes.map((n) => [n.id, n.position]));
  const laidOut = layoutSteps(
    plan.steps.map((step) => step.id),
    plan.links,
  );
  return {
    nodes: plan.steps.map((step) => ({
      id: step.id,
      type: step.type,
      config: step.config,
      position: placed.get(step.id) ?? laidOut.get(step.id)!,
    })),
    edges: plan.links.map(({ from, to, port = DEFAULT_PORT }) => ({
      id: `${from}.${port}->${to}`,
      source: from,
      sourcePort: port,
      target: to,
    })),
  };
}

/** A draft graph in plan form, for showing an existing workflow to an AI. */
export function graphToPlan(graph: WorkflowGraph): FlowPlan {
  return {
    steps: graph.nodes.map(({ id, type, config }) => ({ id, type, config })),
    links: graph.edges.map(({ source, target, sourcePort }) => ({
      from: source,
      to: target,
      ...(sourcePort === DEFAULT_PORT ? {} : { port: sourcePort }),
    })),
  };
}
