import type { WorkflowGraph } from "@/app/flow/domain/types";

const STEP_X = 300;

/** Where a node added from the palette lands: right of the rightmost node. */
export function nextNodePosition(graph: WorkflowGraph): {
  x: number;
  y: number;
} {
  if (graph.nodes.length === 0) return { x: 0, y: 0 };
  const rightmost = graph.nodes.reduce((best, node) =>
    node.position.x > best.position.x ? node : best,
  );
  return { x: rightmost.position.x + STEP_X, y: rightmost.position.y };
}
