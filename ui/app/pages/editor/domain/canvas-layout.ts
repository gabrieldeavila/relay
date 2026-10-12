import type { WorkflowGraph } from "./types";

const STEP_X = 300;

/** Where a node added from the palette lands: right of the rightmost node. */
export function nextNodePosition(graph: WorkflowGraph): { x: number; y: number } {
  if (graph.nodes.length === 0) return { x: 0, y: 0 };
  const rightmost = graph.nodes.reduce((best, node) =>
    node.position.x > best.position.x ? node : best,
  );
  return { x: rightmost.position.x + STEP_X, y: rightmost.position.y };
}

type Measured = { id: string; measured?: { width?: number; height?: number } };

/** Rebuilt nodes keep the size React Flow already measured, so they stay visible. */
export function keepMeasured<T extends Measured>(next: T[], previous: Measured[]): T[] {
  const sizes = new Map(previous.map((node) => [node.id, node.measured]));
  return next.map((node) =>
    sizes.get(node.id) ? { ...node, measured: sizes.get(node.id) } : node,
  );
}
