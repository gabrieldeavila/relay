import type { CanvasStepStatus } from "./step-statuses";
import type { RunStatus } from "./types";

export type Tone = "default" | "info" | "success" | "warning" | "danger";

const TONES: Record<RunStatus | CanvasStepStatus, Tone> = {
  running: "info",
  ready: "info",
  pending: "default",
  retrying: "warning",
  waiting: "warning",
  succeeded: "success",
  failed: "danger",
  timed_out: "danger",
  cancelled: "default",
  skipped: "default",
  not_reached: "default",
};

/** Color family for a run or step status (badges, node borders). */
export const statusTone = (status: RunStatus | CanvasStepStatus): Tone =>
  TONES[status];

/** Statuses that will not change by themselves. */
export const isFinishedRun = (status: RunStatus) =>
  status === "succeeded" || status === "failed" || status === "cancelled";
