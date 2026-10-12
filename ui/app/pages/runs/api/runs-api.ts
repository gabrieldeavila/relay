import { API_URL, apiRequest } from "@/app/api/api-request";
import type { RunSummary } from "../domain/types";

export const listRuns = (workflowId: string) =>
  apiRequest<RunSummary[]>(`/workflows/${workflowId}/runs`);

export const fetchWorkflowName = async (workflowId: string) =>
  (await apiRequest<{ name: string }>(`/workflows/${workflowId}`)).name;

export const startRun = (workflowId: string, payload: unknown) =>
  apiRequest<{ id: string }>(`/workflows/${workflowId}/runs`, {
    method: "POST",
    body: payload,
  });

export const cancelRun = (runId: string) =>
  apiRequest<{ cancelled: boolean }>(`/runs/${runId}/cancel`, {
    method: "POST",
  });

export const retryRun = (runId: string) =>
  apiRequest<{ retried: boolean }>(`/runs/${runId}/retry`, { method: "POST" });

/**
 * Answers an approval through its public link, as the person clicking it in
 * an email would. True when the answer was taken.
 */
export async function answerApproval(url: string): Promise<boolean> {
  const response = await fetch(url, { method: "POST" });
  return response.ok;
}

export { API_URL };
