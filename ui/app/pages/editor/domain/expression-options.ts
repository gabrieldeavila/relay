import type { WorkflowGraph } from "./types";

export interface ExpressionOption {
  /** Node the value comes from; null for run-level values. */
  nodeId: string | null;
  /** What the value is, as an i18n key under `editor:expressions`. */
  labelKey: "triggerData" | "output" | "errorMessage" | "resumeUrl";
  expression: string;
}

/**
 * Values a step can use: the trigger's data and the results of steps that
 * always run before it (upstream), plus the run's resume link.
 */
export function expressionOptions(
  graph: WorkflowGraph,
  nodeId: string,
  isTrigger: (type: string) => boolean,
  hasErrorPort: (type: string) => boolean,
): ExpressionOption[] {
  const typeOf = new Map(graph.nodes.map((node) => [node.id, node.type]));
  const options = upstreamOf(graph, nodeId).flatMap((id): ExpressionOption[] => {
    const type = typeOf.get(id) ?? "";
    if (isTrigger(type)) {
      return [{ nodeId: id, labelKey: "triggerData", expression: "{{ trigger }}" }];
    }
    const output: ExpressionOption = {
      nodeId: id,
      labelKey: "output",
      expression: `{{ steps.${id}.output }}`,
    };
    return hasErrorPort(type)
      ? [output, { nodeId: id, labelKey: "errorMessage", expression: `{{ steps.${id}.error.message }}` }]
      : [output];
  });
  return [
    ...options,
    { nodeId: null, labelKey: "resumeUrl", expression: "{{ run.resumeUrl }}" },
  ];
}

/** Nodes with a path to `nodeId`, nearest first. */
function upstreamOf(graph: WorkflowGraph, nodeId: string): string[] {
  const seen = new Set<string>();
  const queue = [nodeId];
  while (queue.length) {
    const current = queue.shift()!;
    for (const edge of graph.edges) {
      if (edge.target === current && !seen.has(edge.source)) {
        seen.add(edge.source);
        queue.push(edge.source);
      }
    }
  }
  return [...seen];
}
