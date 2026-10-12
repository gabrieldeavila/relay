import { nextNodeId } from "./node-id";
import type {
  CatalogNode,
  GraphEdge,
  WorkflowGraph,
} from "@/app/flow/domain/types";

export const edgeId = (source: string, port: string, target: string) =>
  `${source}.${port}->${target}`;

/** Adds a node with the catalog defaults; returns the new graph and its id. */
export function addNode(
  graph: WorkflowGraph,
  node: CatalogNode,
  position: { x: number; y: number },
) {
  const id = nextNodeId(
    node.type,
    graph.nodes.map((existing) => existing.id),
  );
  const config = defaultConfig(node);
  return {
    id,
    graph: {
      ...graph,
      nodes: [...graph.nodes, { id, type: node.type, config, position }],
    },
  };
}

export const moveNode = (
  graph: WorkflowGraph,
  nodeId: string,
  position: { x: number; y: number },
): WorkflowGraph => ({
  ...graph,
  nodes: graph.nodes.map((node) =>
    node.id === nodeId ? { ...node, position } : node,
  ),
});

export const updateConfig = (
  graph: WorkflowGraph,
  nodeId: string,
  config: Record<string, unknown>,
): WorkflowGraph => ({
  ...graph,
  nodes: graph.nodes.map((node) =>
    node.id === nodeId ? { ...node, config } : node,
  ),
});

/** Removes nodes and every edge touching them. */
export function removeNodes(
  graph: WorkflowGraph,
  nodeIds: string[],
): WorkflowGraph {
  const gone = new Set(nodeIds);
  return {
    nodes: graph.nodes.filter((node) => !gone.has(node.id)),
    edges: graph.edges.filter(
      (edge) => !gone.has(edge.source) && !gone.has(edge.target),
    ),
  };
}

export const removeEdges = (
  graph: WorkflowGraph,
  edgeIds: string[],
): WorkflowGraph => ({
  ...graph,
  edges: graph.edges.filter((edge) => !edgeIds.includes(edge.id)),
});

/**
 * Connects an output port to a node. Ignored (graph unchanged) for loops onto
 * itself, edges into a trigger, and connections that already exist.
 */
export function connect(
  graph: WorkflowGraph,
  connection: Omit<GraphEdge, "id">,
  isTrigger: (nodeId: string) => boolean,
): WorkflowGraph {
  const { source, sourcePort, target } = connection;
  const id = edgeId(source, sourcePort, target);
  if (source === target || isTrigger(target)) return graph;
  if (graph.edges.some((edge) => edge.id === id)) return graph;
  return {
    ...graph,
    edges: [...graph.edges, { id, source, sourcePort, target }],
  };
}

function defaultConfig(node: CatalogNode): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(node.configSchema.properties ?? {})
      .filter(([, schema]) => schema.default !== undefined)
      .map(([name, schema]) => [name, schema.default]),
  );
}
