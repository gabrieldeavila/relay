import { memo } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/ui/components/primitives/badge";
import { elapsed, formatDuration } from "../domain/duration";
import type { StepAttempt } from "../domain/types";

const OUTCOME_TONE = {
  succeeded: "success",
  failed: "danger",
  timed_out: "danger",
  retrying: "warning",
  sleeping: "info",
  waiting: "info",
} as const;

/** Every try of the step, oldest first, with why it failed. */
export const AttemptsList = memo(
  ({ attempts }: { attempts: StepAttempt[] }) => {
    const { t, i18n } = useTranslation("runs");
    if (!attempts.length) return null;

    return (
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">{t("step.attempts")}</h3>
        <ol className="flex flex-col gap-2">
          {attempts.map((attempt) => (
            <li
              key={attempt.id}
              className="rounded-(--radius-sm) border border-(--color-border) p-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <Badge size="sm" variant={OUTCOME_TONE[attempt.outcome]}>
                  {t(`outcome.${attempt.outcome}`)}
                </Badge>
                <span className="text-xs text-(--color-text-muted)">
                  {new Date(attempt.startedAt).toLocaleTimeString(
                    i18n.language,
                  )}{" "}
                  ·{" "}
                  {formatDuration(
                    elapsed(attempt.startedAt, attempt.finishedAt, new Date()),
                  )}
                </span>
              </div>
              {attempt.error && (
                <p className="mt-1 text-(--color-danger)">
                  {attempt.error.message}
                </p>
              )}
            </li>
          ))}
        </ol>
      </section>
    );
  },
);

AttemptsList.displayName = "AttemptsList";
