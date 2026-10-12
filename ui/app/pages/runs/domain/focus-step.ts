import type { RunDetail } from "./types";

/** The step that needs attention: one waiting for an answer, else the failure. */
export function focusStep(run: RunDetail): string | null {
  const waiting = run.steps.find((step) => step.status === "waiting");
  const failed = run.steps.find(
    (step) =>
      (step.status === "failed" || step.status === "timed_out") && !step.port,
  );
  return waiting?.nodeId ?? failed?.nodeId ?? null;
}
