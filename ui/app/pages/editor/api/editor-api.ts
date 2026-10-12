import { ApiError } from "@/app/api/api-error";
import { apiRequest } from "@/app/api/api-request";
import type {
  CatalogNode,
  GraphIssue,
  WorkflowGraph,
} from "@/app/flow/domain/types";

export interface Workflow {
  id: string;
  name: string;
  latestVersion: number | null;
  draftGraph: WorkflowGraph;
}

export type PublishResult =
  | { type: "published"; version: number }
  | { type: "invalid"; issues: GraphIssue[] };

export type TriggerInfo =
  | { kind: "manual" }
  | { kind: "webhook"; url: string }
  | { kind: "schedule"; nextFireAt: string | null; lastFiredAt: string | null };

export const fetchWorkflow = (id: string) =>
  apiRequest<Workflow>(`/workflows/${id}`);

export const fetchTrigger = (id: string) =>
  apiRequest<TriggerInfo>(`/workflows/${id}/trigger`);

export const saveWorkflow = (
  id: string,
  changes: { name?: string; draftGraph?: WorkflowGraph },
) =>
  apiRequest<Workflow>(`/workflows/${id}`, { method: "PATCH", body: changes });

export const startRun = (id: string, payload: unknown = {}) =>
  apiRequest<{ id: string }>(`/workflows/${id}/runs`, {
    method: "POST",
    body: payload,
  });

/** 422 means the draft cannot run yet; its issues come back to point at nodes. */
export async function publishWorkflow(id: string): Promise<PublishResult> {
  try {
    const { version } = await apiRequest<{ version: number }>(
      `/workflows/${id}/publish`,
      { method: "POST" },
    );
    return { type: "published", version };
  } catch (error) {
    const issues = (error as ApiError).body as { issues?: GraphIssue[] } | null;
    if (error instanceof ApiError && error.status === 422 && issues?.issues) {
      return { type: "invalid", issues: issues.issues };
    }
    throw error;
  }
}
