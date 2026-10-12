import { apiRequest } from "@/app/api/api-request";

export interface WorkflowSummary {
  id: string;
  name: string;
  latestVersion: number | null;
  createdAt: string;
  updatedAt: string;
}

export const listWorkflows = () => apiRequest<WorkflowSummary[]>("/workflows");

export const createWorkflow = (name: string) =>
  apiRequest<WorkflowSummary>("/workflows", { method: "POST", body: { name } });
