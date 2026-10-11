import type { GraphEdge, GraphNode, WorkflowGraph } from './graph.js';

/** Lookups over a graph, built once per validation or scheduling pass. */
export interface GraphIndex {
  nodes: Map<string, GraphNode>;
  incoming: Map<string, GraphEdge[]>;
  outgoing: Map<string, GraphEdge[]>;
}

export function indexGraph({ nodes, edges }: WorkflowGraph): GraphIndex {
  const index: GraphIndex = {
    nodes: new Map(nodes.map((node) => [node.id, node])),
    incoming: new Map(nodes.map((node) => [node.id, []])),
    outgoing: new Map(nodes.map((node) => [node.id, []])),
  };
  for (const edge of edges) {
    index.outgoing.get(edge.source)?.push(edge);
    index.incoming.get(edge.target)?.push(edge);
  }
  return index;
}
