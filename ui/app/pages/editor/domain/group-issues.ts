import type { GraphIssue, WorkflowGraph } from "@/app/flow/domain/types";

export interface GroupedIssues {
  byNode: Map<string, GraphIssue[]>;
  /** Issues about the flow as a whole (e.g. no trigger). */
  general: GraphIssue[];
}

/** Puts each publish issue on the node it is about, so the canvas can mark it. */
export function groupIssues(
  issues: GraphIssue[],
  graph: WorkflowGraph,
): GroupedIssues {
  const sourceOf = new Map(graph.edges.map((edge) => [edge.id, edge.source]));
  const grouped: GroupedIssues = { byNode: new Map(), general: [] };
  for (const issue of issues) {
    const nodeIds = issue.path ?? [
      issue.nodeId ?? sourceOf.get(issue.edgeId ?? ""),
    ];
    const known = nodeIds.filter((id): id is string => Boolean(id));
    if (known.length === 0) grouped.general.push(issue);
    for (const id of known) {
      grouped.byNode.set(id, [...(grouped.byNode.get(id) ?? []), issue]);
    }
  }
  return grouped;
}
