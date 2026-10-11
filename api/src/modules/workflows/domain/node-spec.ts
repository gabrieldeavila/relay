export type NodeKind = 'trigger' | 'action';

/** What graph validation needs to know about a catalog node type. */
export interface NodeSpec {
  type: string;
  kind: NodeKind;
  outputPorts: readonly string[];
  requiredConfig: readonly string[];
}

export type FindNodeSpec = (type: string) => NodeSpec | undefined;
