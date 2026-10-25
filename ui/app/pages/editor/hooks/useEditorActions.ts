import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { ApiError } from "@/app/api/api-error";
import type { GraphIssue } from "@/app/flow/domain/types";
import type { useToasts } from "@/app/hooks/useToasts";
import { startRun } from "../api/editor-api";
import { useDraftTest } from "./useDraftTest";
import { usePublish } from "./usePublish";

type Toasts = ReturnType<typeof useToasts>;

/** Test, Publish and Run now, reported through toasts. */
export const useEditorActions = (
  id: string,
  draft: {
    flush: () => Promise<void>;
    markPublished: (version: number) => void;
  },
  reloadTrigger: () => void,
  toasts: Toasts,
) => {
  const { t } = useTranslation("editor");
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);
  // Issues of the last refused test or publish, pointing at nodes.
  const [issues, setIssues] = useState<GraphIssue[]>([]);
  const openRun = (runId: string) =>
    void navigate(`/workflows/${id}/runs/${runId}`);
  const refused = (message: string) => (found: GraphIssue[]) => {
    setIssues(found);
    toasts.push({ variant: "warning", title: message });
  };
  const failed = (error: unknown) =>
    toasts.push({ variant: "error", title: (error as Error).message });

  const publishing = usePublish(
    id,
    draft.flush,
    (version) => {
      setIssues([]);
      draft.markPublished(version);
      reloadTrigger();
      toasts.push({ variant: "success", title: t("publishOk", { version }) });
    },
    refused(t("publishInvalid")),
  );
  const testing = useDraftTest(
    id,
    draft.flush,
    openRun,
    refused(t("testInvalid")),
  );

  const run = async () => {
    setRunning(true);
    try {
      const { id: runId } = await startRun(id);
      openRun(runId);
    } catch (error) {
      const notPublished = error instanceof ApiError && error.status === 404;
      if (!notPublished) return failed(error);
      toasts.push({ variant: "warning", title: t("runNeedsPublish") });
    } finally {
      setRunning(false);
    }
  };

  const clearIssues = useCallback(
    () => setIssues((current) => (current.length ? [] : current)),
    [],
  );

  return {
    publish: () => publishing.publish().catch(failed),
    test: () => testing.test().catch(failed),
    run,
    running,
    testing: testing.testing,
    publishing: publishing.publishing,
    issues,
    clearIssues,
  };
};
