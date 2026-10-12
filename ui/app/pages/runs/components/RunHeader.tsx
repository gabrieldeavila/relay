import { memo } from "react";
import { useTranslation } from "react-i18next";
import { FiPlay, FiRotateCcw, FiSquare } from "react-icons/fi";

import { Badge } from "@/ui/components/primitives/badge";
import { Button } from "@/ui/components/primitives/button";
import { elapsed, formatDuration } from "../domain/duration";
import { isFinishedRun, statusTone } from "../domain/status-tone";
import type { RunDetail } from "../domain/types";

type RunHeaderProps = {
  run: RunDetail;
  busy: string | null;
  onCancel: () => void;
  onRetry: () => void;
  onRunAgain: () => void;
};

export const RunHeader = memo(
  ({ run, busy, onCancel, onRetry, onRunAgain }: RunHeaderProps) => {
    const { t, i18n } = useTranslation("runs");
    const started = new Date(run.createdAt).toLocaleString(i18n.language, {
      dateStyle: "medium",
      timeStyle: "medium",
    });

    return (
      <div className="flex flex-wrap items-center gap-3 border-b border-(--color-border) px-4 py-2">
        <Badge variant={statusTone(run.status)}>
          {t(`status.${run.status}`)}
        </Badge>
        <span className="text-sm text-(--color-text-muted)">
          {t("header.summary", {
            version: run.version,
            started,
            duration: formatDuration(
              elapsed(run.createdAt, run.finishedAt, new Date()),
            ),
          })}
        </span>
        <div className="ml-auto flex gap-2">
          {!isFinishedRun(run.status) && (
            <Button
              size="sm"
              variant="ghost"
              isLoading={busy === "cancel"}
              leftIcon={<FiSquare aria-hidden="true" />}
              onClick={onCancel}
            >
              {t("actions.cancel")}
            </Button>
          )}
          {run.status === "failed" && (
            <Button
              size="sm"
              isLoading={busy === "retry"}
              leftIcon={<FiRotateCcw aria-hidden="true" />}
              onClick={onRetry}
            >
              {t("actions.retry")}
            </Button>
          )}
          <Button
            size="sm"
            variant="secondary"
            isLoading={busy === "runAgain"}
            leftIcon={<FiPlay aria-hidden="true" />}
            onClick={onRunAgain}
          >
            {t("actions.runAgain")}
          </Button>
        </div>
      </div>
    );
  },
);

RunHeader.displayName = "RunHeader";
