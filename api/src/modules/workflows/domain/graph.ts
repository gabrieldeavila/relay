export interface NodePosition {
  x: number;
  y: number;
}

/** One trigger or action placed on the canvas. */
export interface GraphNode {
  id: string;
  /** Catalog type, e.g. `http.request` or `pincel.draw_text`. */
  type: string;
  config: Record<string, unknown>;
  position: NodePosition;
}

/** Connects an output port of `source` to `target`. */
export interface GraphEdge {
  id: string;
  source: string;
  /** `out` for plain actions; `true` / `false`, `error`, `timeout` for routed results. */
  sourcePort: string;
  target: string;
}

export interface WorkflowGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export const DEFAULT_PORT = 'out';
