import type { RunDetail, StepStatus } from "./types";

/** `not_reached`: the run ended before this step had its turn. */
export type CanvasStepStatus = StepStatus | "not_reached";

/** Status of every node of the run's graph, for coloring the canvas. */
export function stepStatuses(run: RunDetail): Map<string, CanvasStepStatus> {
  const byNode = new Map(run.steps.map((step) => [step.nodeId, step.status]));
  const finished = run.status !== "running" && run.status !== "waiting";
  return new Map(
    run.graph.nodes.map((node) => [
      node.id,
      byNode.get(node.id) ?? (finished ? "not_reached" : "pending"),
    ]),
  );
}
