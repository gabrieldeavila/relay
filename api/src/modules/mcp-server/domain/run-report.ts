import { runLink } from './relay-links.js';
import { trimValue } from './trim-value.js';

interface RunLike {
  id: string;
  workflowId: string;
  status: string;
  version: number;
  createdAt: Date;
  finishedAt: Date | null;
  steps: {
    nodeId: string;
    status: string;
    port: string | null;
    attempt: number;
    output: unknown;
    error: unknown;
  }[];
}

/** A run as an AI client reads it: status, each step's result, and the page to open. */
export function runReport(run: RunLike, uiUrl: string) {
  return {
    id: run.id,
    status: run.status,
    version: run.version,
    startedAt: run.createdAt.toISOString(),
    finishedAt: run.finishedAt?.toISOString() ?? null,
    link: runLink(uiUrl, run.workflowId, run.id),
    steps: run.steps.map((step) => ({
      id: step.nodeId,
      status: step.status,
      ...(step.port ? { port: step.port } : {}),
      attempt: step.attempt,
      ...(step.error ? { error: step.error } : {}),
      ...(step.output !== null && step.output !== undefined
        ? { output: trimValue(step.output) }
        : {}),
    })),
  };
}
