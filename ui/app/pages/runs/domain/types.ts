import type { WorkflowGraph } from "@/app/flow/domain/types";

export type RunStatus =
  "running" | "waiting" | "succeeded" | "failed" | "cancelled";

export type StepStatus =
  | "pending"
  | "ready"
  | "running"
  | "retrying"
  | "waiting"
  | "succeeded"
  | "failed"
  | "timed_out"
  | "skipped"
  | "cancelled";

export interface StepError {
  kind: string;
  message: string;
  status?: number;
}

export interface StepAttempt {
  id: string;
  attempt: number;
  outcome:
    "succeeded" | "failed" | "retrying" | "sleeping" | "waiting" | "timed_out";
  error: StepError | null;
  startedAt: string;
  finishedAt: string;
}

export interface RunStep {
  id: string;
  nodeId: string;
  status: StepStatus;
  port: string | null;
  attempt: number;
  runAt: string;
  waitingFor: "time" | "event" | null;
  deadlineAt: string | null;
  input: unknown;
  output: unknown;
  error: StepError | null;
  createdAt: string;
  updatedAt: string;
  attempts: StepAttempt[];
}

export interface RunSummary {
  id: string;
  workflowId: string;
  status: RunStatus;
  /** Null for a test of the draft, which is never published. */
  version: number | null;
  triggerPayload: unknown;
  createdAt: string;
  finishedAt: string | null;
}

export interface RunDetail extends RunSummary {
  resumeToken: string;
  graph: WorkflowGraph;
  steps: RunStep[];
}
