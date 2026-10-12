import type { Edge, Node } from "@xyflow/react";

import type { CatalogNode, GraphIssue, WorkflowGraph } from "./types";

export type StatusTone = "default" | "info" | "success" | "warning" | "danger";

/** A step's state in a run, shown on its card (runs view only). */
export interface NodeStatus {
  /** i18n key under `runs:status`. */
  key: string;
  tone: StatusTone;
  /** Steps that were skipped or never reached are drawn faded. */
  faded: boolean;
}

export type WorkflowNodeData = {
  nodeId: string;
  catalog: CatalogNode | undefined;
  issues: GraphIssue[];
  status?: NodeStatus;
};

export type WorkflowFlowNode = Node<WorkflowNodeData, "workflow">;

/** Our graph as React Flow nodes and edges (port = source handle). */
export interface FlowDecorations {
  selectedId?: string | null;
  issuesByNode?: Map<string, GraphIssue[]>;
  statusByNode?: Map<string, NodeStatus>;
  /** Readable name of an exit, shown on edges that are not the plain `out`. */
  portLabel?: (port: string) => string;
}

export function toFlowElements(
  graph: WorkflowGraph,
  catalog: Map<string, CatalogNode>,
  {
    selectedId = null,
    issuesByNode,
    statusByNode,
    portLabel = (port) => port,
  }: FlowDecorations = {},
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
        issues: issuesByNode?.get(node.id) ?? [],
        status: statusByNode?.get(node.id),
      },
    })),
    edges: graph.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      sourceHandle: edge.sourcePort,
      target: edge.target,
      label: edge.sourcePort === "out" ? undefined : portLabel(edge.sourcePort),
    })),
  };
}
