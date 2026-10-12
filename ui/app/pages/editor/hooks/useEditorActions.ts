import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { ApiError } from "@/app/api/api-error";
import type { useToasts } from "@/app/hooks/useToasts";
import { startRun } from "../api/editor-api";
import { usePublish } from "./usePublish";

type Toasts = ReturnType<typeof useToasts>;

/** Publish and Run now, reported through toasts. */
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
  const publishing = usePublish(id, draft.flush, (version) => {
    draft.markPublished(version);
    reloadTrigger();
    toasts.push({ variant: "success", title: t("publishOk", { version }) });
  });

  const publish = async () => {
    const ok = await publishing.publish();
    if (!ok) toasts.push({ variant: "warning", title: t("publishInvalid") });
  };

  const run = async () => {
    setRunning(true);
    try {
      const { id: runId } = await startRun(id);
      void navigate(`/workflows/${id}/runs/${runId}`);
    } catch (error) {
      const notPublished = error instanceof ApiError && error.status === 404;
      toasts.push({
        variant: notPublished ? "warning" : "error",
        title: notPublished ? t("runNeedsPublish") : (error as Error).message,
      });
    } finally {
      setRunning(false);
    }
  };

  return {
    publish,
    run,
    running,
    publishing: publishing.publishing,
    issues: publishing.issues,
    clearIssues: publishing.clearIssues,
  };
};
