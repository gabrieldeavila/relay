import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Badge } from "@/ui/components/primitives/badge";
import { cn } from "@/ui/helpers/cn";
import { relativeTime } from "@/app/format/relative-time";
import { statusTone } from "../domain/status-tone";
import type { RunSummary } from "../domain/types";

type RunsSidebarProps = {
  workflowId: string;
  runs: RunSummary[];
  activeId?: string;
};

/** Recent runs of the workflow, newest first. */
export const RunsSidebar = memo(
  ({ workflowId, runs, activeId }: RunsSidebarProps) => {
    const { t, i18n } = useTranslation("runs");
    const now = new Date();

    return (
      <nav aria-label={t("list.title")} className="flex flex-col gap-1 p-3">
        <h2 className="mb-1 text-sm font-semibold">{t("list.title")}</h2>
        {runs.length === 0 && (
          <p className="text-sm text-(--color-text-muted)">{t("list.empty")}</p>
        )}
        {runs.map((run) => (
          <Link
            key={run.id}
            to={`/workflows/${workflowId}/runs/${run.id}`}
            aria-current={run.id === activeId ? "page" : undefined}
            className={cn(
              "flex items-center justify-between gap-2 rounded-(--radius-sm) px-2 py-1.5 text-sm hover:bg-(--color-surface-2)",
              run.id === activeId && "bg-(--color-surface-2)",
            )}
          >
            <span className="flex items-center gap-1.5 text-(--color-text-muted)">
              {relativeTime(new Date(run.createdAt), now, i18n.language)}
              {run.version === null && (
                <Badge size="sm" variant="info">
                  {t("list.test")}
                </Badge>
              )}
            </span>
            <Badge size="sm" variant={statusTone(run.status)}>
              {t(`status.${run.status}`)}
            </Badge>
          </Link>
        ))}
      </nav>
    );
  },
);

RunsSidebar.displayName = "RunsSidebar";
