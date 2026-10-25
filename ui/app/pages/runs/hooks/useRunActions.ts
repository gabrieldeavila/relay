import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import type { useToasts } from "@/app/hooks/useToasts";
import {
  answerApproval,
  cancelRun,
  retryRun,
  startRun,
  testDraft,
} from "../api/runs-api";
import type { RunDetail } from "../domain/types";

type Toasts = ReturnType<typeof useToasts>;

/**
 * Cancel, Retry, Run again and approval answers, reported through toasts.
 * Running a test again tests the draft as it is now, with the same payload.
 */
export const useRunActions = (
  run: RunDetail | null,
  onChanged: () => void,
  toasts: Toasts,
) => {
  const { t } = useTranslation("runs");
  const navigate = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);

  const perform = async (name: string, action: () => Promise<void>) => {
    setBusy(name);
    try {
      await action();
      onChanged();
    } catch (error) {
      toasts.push({ variant: "error", title: (error as Error).message });
    } finally {
      setBusy(null);
    }
  };

  return {
    busy,
    cancel: () =>
      run && perform("cancel", async () => void (await cancelRun(run.id))),
    retry: () =>
      run && perform("retry", async () => void (await retryRun(run.id))),
    runAgain: () =>
      run &&
      perform("runAgain", async () => {
        const again = run.version === null ? testDraft : startRun;
        const started = await again(run.workflowId, run.triggerPayload);
        if (!started)
          return toasts.push({ variant: "warning", title: t("testInvalid") });
        void navigate(`/workflows/${run.workflowId}/runs/${started.id}`);
      }),
    answer: (url: string) =>
      perform("answer", async () => {
        const taken = await answerApproval(url);
        if (!taken)
          toasts.push({ variant: "warning", title: t("answerClosed") });
      }),
  };
};
