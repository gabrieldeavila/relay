import type { Edge, Node } from "@xyflow/react";

import type { CatalogNode, GraphIssue, WorkflowGraph } from "./types";

export type WorkflowNodeData = {
  nodeId: string;
  catalog: CatalogNode | undefined;
  issues: GraphIssue[];
};

export type WorkflowFlowNode = Node<WorkflowNodeData, "workflow">;

/** Our graph as React Flow nodes and edges (port = source handle). */
export function toFlowElements(
  graph: WorkflowGraph,
  catalog: Map<string, CatalogNode>,
  issuesByNode: Map<string, GraphIssue[]>,
  selectedId: string | null,
): { nodes: WorkflowFlowNode[]; edges: Edge[] } {
  return {
    nodes: graph.nodes.map((node) => ({
      id: node.id,
      type: "workflow",
      position: node.position,
      selected: node.id === selectedId,
      data: {
        nodeId: node.id,
        catalog: catalog.get(node.type),
        issues: issuesByNode.get(node.id) ?? [],
      },
    })),
    edges: graph.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      sourceHandle: edge.sourcePort,
      target: edge.target,
      label: edge.sourcePort === "out" ? undefined : edge.sourcePort,
    })),
  };
}
