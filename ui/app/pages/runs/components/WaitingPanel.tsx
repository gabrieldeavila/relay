import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiCheck, FiCopy, FiX } from "react-icons/fi";

import { Alert } from "@/ui/components/primitives/alert";
import { Button } from "@/ui/components/primitives/button";
import type { WaitingAction } from "../domain/waiting-action";

type WaitingPanelProps = {
  action: WaitingAction;
  deadline: string | null;
  busy: boolean;
  onAnswer: (url: string) => void;
};

/** What the run is waiting for, and the way to answer it from here. */
export const WaitingPanel = memo(
  ({ action, deadline, busy, onAnswer }: WaitingPanelProps) => {
    const { t, i18n } = useTranslation(["runs", "common"]);
    const [copied, setCopied] = useState(false);
    const when = (iso: string) =>
      new Date(iso).toLocaleString(i18n.language, {
        dateStyle: "medium",
        timeStyle: "short",
      });

    const copy = async (url: string) => {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <Alert variant="warning">
        {action.kind === "timer" && (
          <p>{t("waiting.timer", { when: when(action.until) })}</p>
        )}
        {action.kind === "approval" && (
          <div className="flex flex-col gap-2">
            <p>{t("waiting.approval")}</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                isLoading={busy}
                leftIcon={<FiCheck aria-hidden="true" />}
                onClick={() => onAnswer(action.approveUrl)}
              >
                {t("waiting.approve")}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={busy}
                leftIcon={<FiX aria-hidden="true" />}
                onClick={() => onAnswer(action.rejectUrl)}
              >
                {t("waiting.reject")}
              </Button>
            </div>
          </div>
        )}
        {action.kind === "webhook" && (
          <div className="flex flex-col gap-2">
            <p>{t("waiting.webhook")}</p>
            <code className="break-all rounded-(--radius-sm) bg-(--color-surface-2) p-2 font-mono text-xs">
              {action.url}
            </code>
            <Button
              size="sm"
              variant="secondary"
              className="self-start"
              leftIcon={<FiCopy aria-hidden="true" />}
              onClick={() => void copy(action.url)}
            >
              {copied ? t("common:copied") : t("common:copy")}
            </Button>
          </div>
        )}
        {deadline && (
          <p className="mt-2 text-xs">
            {t("waiting.deadline", { when: when(deadline) })}
          </p>
        )}
      </Alert>
    );
  },
);

WaitingPanel.displayName = "WaitingPanel";
