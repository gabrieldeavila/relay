/** Mirrors the API's graph and catalog shapes. */
export interface GraphNode {
  id: string;
  type: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
}

export interface GraphEdge {
  id: string;
  source: string;
  sourcePort: string;
  target: string;
}

export interface WorkflowGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export type JsonSchema = {
  type?: string;
  description?: string;
  anyOf?: JsonSchema[];
  format?: string;
  /** Relay's own hint for the form, e.g. `textarea` for long text. */
  widget?: string;
  enum?: unknown[];
  const?: unknown;
  default?: unknown;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  additionalProperties?: JsonSchema | boolean;
  items?: JsonSchema;
  oneOf?: JsonSchema[];
};

export interface CatalogNode {
  type: string;
  kind: "trigger" | "action";
  /** Connected app the node comes from; null for built-in nodes. */
  group: string | null;
  title: string;
  description: string;
  outputPorts: string[];
  configSchema: JsonSchema;
}

export interface GraphIssue {
  code: string;
  nodeId?: string;
  edgeId?: string;
  field?: string;
  path?: string[];
}
