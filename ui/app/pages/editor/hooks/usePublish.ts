import { useCallback, useState } from "react";

import { publishWorkflow } from "../api/editor-api";
import type { GraphIssue } from "../domain/types";

/** Saves pending edits, then publishes; keeps the issues of a refused publish. */
export const usePublish = (
  id: string,
  flush: () => Promise<void>,
  onPublished: (version: number) => void,
) => {
  const [publishing, setPublishing] = useState(false);
  const [issues, setIssues] = useState<GraphIssue[]>([]);
  const [error, setError] = useState<string | null>(null);

  const publish = async (): Promise<boolean> => {
    setPublishing(true);
    setError(null);
    try {
      await flush();
      const result = await publishWorkflow(id);
      if (result.type === "invalid") {
        setIssues(result.issues);
        return false;
      }
      setIssues([]);
      onPublished(result.version);
      return true;
    } catch (publishError) {
      setError((publishError as Error).message);
      return false;
    } finally {
      setPublishing(false);
    }
  };

  const clearIssues = useCallback(
    () => setIssues((current) => (current.length ? [] : current)),
    [],
  );
  return { publish, publishing, issues, error, clearIssues };
};
