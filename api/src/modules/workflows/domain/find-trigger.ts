import type { GraphNode, WorkflowGraph } from './graph.js';
import type { FindNodeSpec } from './node-spec.js';

/** The graph's trigger node; validated graphs have exactly one. */
export function findTrigger(
  graph: WorkflowGraph,
  findSpec: FindNodeSpec,
): GraphNode | undefined {
  return graph.nodes.find((node) => findSpec(node.type)?.kind === 'trigger');
}
