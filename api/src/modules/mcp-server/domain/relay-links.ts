/** Pages in Relay's UI, so an AI client can hand the user a link. */
export const editorLink = (uiUrl: string, workflowId: string) =>
  `${uiUrl}/workflows/${workflowId}`;

export const runLink = (uiUrl: string, workflowId: string, runId: string) =>
  `${uiUrl}/workflows/${workflowId}/runs/${runId}`;
