import { memo } from "react";
import { useTranslation } from "react-i18next";
import { FiChevronRight } from "react-icons/fi";
import { Link } from "react-router";

import { Badge } from "@/ui/components/primitives/badge";
import type { WorkflowSummary } from "../api/workflows-api";
import { relativeTime } from "@/app/format/relative-time";

type WorkflowRowProps = { workflow: WorkflowSummary };

export const WorkflowRow = memo(({ workflow }: WorkflowRowProps) => {
  const { t, i18n } = useTranslation("workflows");
  const updated = relativeTime(
    new Date(workflow.updatedAt),
    new Date(),
    i18n.language,
  );

  return (
    <li>
      <Link
        to={`/workflows/${workflow.id}`}
        className="flex items-center gap-4 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-4 py-3 transition-colors hover:border-(--color-border-strong) hover:bg-(--color-surface-2)"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{workflow.name}</p>
          <p className="text-sm text-(--color-text-muted)">
            {t("updated", { when: updated })}
          </p>
        </div>
        {workflow.latestVersion ? (
          <Badge variant="success">
            {t("published", { version: workflow.latestVersion })}
          </Badge>
        ) : (
          <Badge>{t("draft")}</Badge>
        )}
        <FiChevronRight
          aria-hidden="true"
          className="text-(--color-text-muted)"
        />
      </Link>
    </li>
  );
});

WorkflowRow.displayName = "WorkflowRow";
