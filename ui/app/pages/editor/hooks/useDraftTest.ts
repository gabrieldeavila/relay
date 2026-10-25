import { useState } from "react";

import { testDraft } from "../api/editor-api";
import type { GraphIssue } from "@/app/flow/domain/types";

/** Saves pending edits, then runs the draft once without publishing it. */
export const useDraftTest = (
  id: string,
  flush: () => Promise<void>,
  onStarted: (runId: string) => void,
  onInvalid: (issues: GraphIssue[]) => void,
) => {
  const [testing, setTesting] = useState(false);

  const test = async (): Promise<void> => {
    setTesting(true);
    try {
      await flush();
      const result = await testDraft(id);
      if (result.type === "invalid") onInvalid(result.issues);
      else onStarted(result.runId);
    } finally {
      setTesting(false);
    }
  };

  return { test, testing };
};
