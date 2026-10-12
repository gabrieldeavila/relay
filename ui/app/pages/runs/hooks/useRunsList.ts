import { useCallback, useEffect, useState } from "react";

import { fetchWorkflowName, listRuns } from "../api/runs-api";
import type { RunSummary } from "../domain/types";

const REFRESH_MS = 5_000;

/** The workflow's recent runs, refreshed while the page is open. */
export const useRunsList = (workflowId: string) => {
  const [runs, setRuns] = useState<RunSummary[] | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setRuns(await listRuns(workflowId));
      setError(null);
    } catch (loadError) {
      setError((loadError as Error).message);
    }
  }, [workflowId]);

  useEffect(() => {
    void reload();
    fetchWorkflowName(workflowId).then(setName, () => undefined);
    const timer = setInterval(() => void reload(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [workflowId, reload]);

  return { runs, name, error, reload };
};
