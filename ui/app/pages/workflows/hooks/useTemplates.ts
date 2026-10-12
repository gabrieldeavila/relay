import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import {
  listTemplates,
  createFromTemplate,
  type TemplateSummary,
} from "../api/templates-api";

/** Ready-made flows; using one opens it in the editor to fill the blanks. */
export const useTemplates = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<TemplateSummary[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listTemplates().then(setTemplates, (loadError: Error) =>
      setError(loadError.message),
    );
  }, []);

  const start = async (id: string, name: string) => {
    setBusyId(id);
    setError(null);
    try {
      const workflow = await createFromTemplate(id, name);
      void navigate(`/workflows/${workflow.id}`);
    } catch (useError) {
      setError((useError as Error).message);
      setBusyId(null);
    }
  };

  return { templates, busyId, error, start };
};
