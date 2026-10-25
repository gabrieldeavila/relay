import { useState } from "react";

import { publishWorkflow } from "../api/editor-api";
import type { GraphIssue } from "@/app/flow/domain/types";

/** Saves pending edits, then publishes; hands back the issues of a refused publish. */
export const usePublish = (
  id: string,
  flush: () => Promise<void>,
  onPublished: (version: number) => void,
  onInvalid: (issues: GraphIssue[]) => void,
) => {
  const [publishing, setPublishing] = useState(false);

  const publish = async (): Promise<void> => {
    setPublishing(true);
    try {
      await flush();
      const result = await publishWorkflow(id);
      if (result.type === "invalid") onInvalid(result.issues);
      else onPublished(result.version);
    } finally {
      setPublishing(false);
    }
  };

  return { publish, publishing };
};
