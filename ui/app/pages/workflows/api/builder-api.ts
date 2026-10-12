import { apiRequest } from "@/app/api/api-request";

export interface DraftIssue {
  code: string;
  nodeId?: string;
  field?: string;
  message: string;
}

export interface DraftedWorkflow {
  id: string;
  name: string;
  /** Claude's plain-words description, including what is left to fill in. */
  summary: string;
  issues: DraftIssue[];
}

/** Claude drafts a workflow from the description; it is saved, never published. */
export const draftWorkflow = (description: string) =>
  apiRequest<DraftedWorkflow>("/workflows/build", {
    method: "POST",
    body: { description },
  });
