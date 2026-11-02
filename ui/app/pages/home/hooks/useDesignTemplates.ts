import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";

import { useLoad } from "@/app/hooks/useLoad";
import { createFromTemplate, listDesignTemplates } from "../api/templates-api";
import { groupTemplates } from "../domain/group-templates";

/** The template gallery: templates by category, and opening a new image from one. */
export const useDesignTemplates = () => {
  const navigate = useNavigate();
  const templates = useLoad(listDesignTemplates, "templates");
  const [creating, setCreating] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const groups = useMemo(
    () => (templates.data ? groupTemplates(templates.data) : null),
    [templates.data],
  );

  const startFromTemplate = useCallback(
    async (name: string) => {
      setCreating(name);
      setCreateError(null);
      try {
        const { imageId } = await createFromTemplate(name);
        navigate(`/images/${imageId}`);
      } catch (error) {
        setCreateError((error as Error).message);
        setCreating(null);
      }
    },
    [navigate],
  );

  return {
    groups,
    error: templates.error ?? createError,
    creating,
    startFromTemplate,
  };
};
