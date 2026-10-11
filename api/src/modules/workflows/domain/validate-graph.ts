import { findCycle } from './find-cycle.js';
import type { GraphNode, WorkflowGraph } from './graph.js';
import { indexGraph, type GraphIndex } from './graph-index.js';
import type { GraphIssue } from './graph-issue.js';
import type { FindNodeSpec } from './node-spec.js';

/**
 * Everything that keeps a graph from being published. Empty means it can run:
 * one trigger, known node types, required config filled, valid edges and ports,
 * no cycles, and every node reachable from the trigger.
 */
export function validateGraph(
  graph: WorkflowGraph,
  findSpec: FindNodeSpec,
): GraphIssue[] {
  const duplicates = checkDuplicateIds(graph.nodes);
  if (duplicates.length) return duplicates;

  const index = indexGraph(graph);
  const structural = [
    ...checkNodes(graph.nodes, findSpec),
    ...checkEdges(graph, index, findSpec),
  ];
  const triggers = checkTriggers(graph.nodes, index, findSpec);
  const cycle = findCycle(index);
  const flow = cycle
    ? [{ code: 'cycle' as const, path: cycle }]
    : checkReachable(index, graph.nodes, findSpec);

  return [...structural, ...triggers, ...flow];
}

function checkDuplicateIds(nodes: GraphNode[]): GraphIssue[] {
  const seen = new Set<string>();
  const issues: GraphIssue[] = [];
  for (const { id } of nodes) {
    if (seen.has(id)) issues.push({ code: 'duplicate_node_id', nodeId: id });
    seen.add(id);
  }
  return issues;
}

function checkNodes(nodes: GraphNode[], findSpec: FindNodeSpec) {
  return nodes.flatMap((node): GraphIssue[] => {
    const spec = findSpec(node.type);
    if (!spec) return [{ code: 'unknown_node_type', nodeId: node.id }];
    return spec.requiredConfig
      .filter((field) => isBlank(node.config[field]))
      .map((field) => ({ code: 'missing_config', nodeId: node.id, field }));
  });
}

function checkEdges(
  { edges }: WorkflowGraph,
  index: GraphIndex,
  findSpec: FindNodeSpec,
) {
  return edges.flatMap((edge): GraphIssue[] => {
    const source = index.nodes.get(edge.source);
    if (!source || !index.nodes.has(edge.target)) {
      return [{ code: 'edge_unknown_node', edgeId: edge.id }];
    }
    const spec = findSpec(source.type);
    if (spec && !spec.outputPorts.includes(edge.sourcePort)) {
      return [
        { code: 'invalid_port', edgeId: edge.id, field: edge.sourcePort },
      ];
    }
    return [];
  });
}

function checkTriggers(
  nodes: GraphNode[],
  index: GraphIndex,
  findSpec: FindNodeSpec,
): GraphIssue[] {
  const triggers = nodes.filter((node) => isTrigger(node, findSpec));
  if (triggers.length === 0) return [{ code: 'no_trigger' }];

  const issues: GraphIssue[] = triggers
    .filter((trigger) => index.incoming.get(trigger.id)?.length)
    .map((trigger) => ({ code: 'trigger_has_input', nodeId: trigger.id }));
  if (triggers.length > 1) {
    issues.push(
      ...triggers.slice(1).map((trigger) => ({
        code: 'multiple_triggers' as const,
        nodeId: trigger.id,
      })),
    );
  }
  return issues;
}

function checkReachable(
  index: GraphIndex,
  nodes: GraphNode[],
  findSpec: FindNodeSpec,
): GraphIssue[] {
  const trigger = nodes.find((node) => isTrigger(node, findSpec));
  if (!trigger) return [];

  const reached = new Set<string>();
  const queue = [trigger.id];
  while (queue.length) {
    const nodeId = queue.shift()!;
    if (reached.has(nodeId)) continue;
    reached.add(nodeId);
    queue.push(
      ...(index.outgoing.get(nodeId) ?? []).map((edge) => edge.target),
    );
  }
  return nodes
    .filter((node) => !reached.has(node.id) && !isTrigger(node, findSpec))
    .map((node) => ({ code: 'unreachable_node', nodeId: node.id }));
}

function isTrigger(node: GraphNode, findSpec: FindNodeSpec) {
  return findSpec(node.type)?.kind === 'trigger';
}

function isBlank(value: unknown) {
  return (
    value === undefined ||
    value === null ||
    (typeof value === 'string' && value.trim() === '')
  );
}
