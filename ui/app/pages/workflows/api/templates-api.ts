import { apiRequest } from "@/app/api/api-request";

export type TemplateNeed =
  | { kind: "app"; key: string; name: string; ready: boolean }
  | { kind: "account"; key: "email" | "telegram" | "ai"; ready: boolean };

export interface TemplateSummary {
  id: string;
  title: string;
  description: string;
  needs: TemplateNeed[];
  /** False while an app it draws with is not connected. */
  canUse: boolean;
}

export const listTemplates = () => apiRequest<TemplateSummary[]>("/templates");

/** Creates a draft workflow from the template; returns its id. */
export const createFromTemplate = (id: string, name: string) =>
  apiRequest<{ id: string }>(`/templates/${id}/use`, {
    method: "POST",
    body: { name },
  });
