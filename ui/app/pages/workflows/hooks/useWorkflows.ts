import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";

import {
  createWorkflow,
  listWorkflows,
  type WorkflowSummary,
} from "../api/workflows-api";

/** The user's workflows, and creating one (which opens the editor). */
export const useWorkflows = () => {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<WorkflowSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setWorkflows(await listWorkflows());
      setError(null);
    } catch (loadError) {
      setError((loadError as Error).message);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const create = async (name: string) => {
    const workflow = await createWorkflow(name);
    void navigate(`/workflows/${workflow.id}`);
  };

  return { workflows, error, create, reload };
};
