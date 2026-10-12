import type { RunDetail, RunStep } from "./types";

export type WaitingAction =
  | { kind: "approval"; approveUrl: string; rejectUrl: string }
  | { kind: "webhook"; url: string }
  | { kind: "timer"; until: string };

/** What can move a waiting step forward, and the links to do it. */
export function waitingAction(
  run: RunDetail,
  step: RunStep,
  nodeType: string,
  apiUrl: string,
): WaitingAction | null {
  if (step.status !== "waiting") return null;
  if (step.waitingFor === "time") return { kind: "timer", until: step.runAt };
  const base = `${apiUrl}/resume/${run.resumeToken}/${step.nodeId}`;
  if (nodeType === "flow.approval") {
    return {
      kind: "approval",
      approveUrl: `${base}/approve`,
      rejectUrl: `${base}/reject`,
    };
  }
  return { kind: "webhook", url: base };
}
