import { API_URL, apiRequest } from "@/app/api/api-request";
import type { DesignTemplateEntry } from "../domain/design-template";

export const listDesignTemplates = () =>
  apiRequest<DesignTemplateEntry[]>("/design-templates");

export const designPreviewUrl = (name: string) =>
  `${API_URL}/design-templates/${encodeURIComponent(name)}/preview.png?maxSize=480`;

/** Creates an image from the template with its default texts. */
export const createFromTemplate = (name: string) =>
  apiRequest<{ imageId: string }>(
    `/design-templates/${encodeURIComponent(name)}/use`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    },
  );
