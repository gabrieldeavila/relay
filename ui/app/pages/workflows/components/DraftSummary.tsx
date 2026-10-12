import { memo } from "react";
import { useTranslation } from "react-i18next";
import { FiArrowRight } from "react-icons/fi";
import { Link } from "react-router";

import type { DraftedWorkflow } from "../api/builder-api";

type DraftSummaryProps = { draft: DraftedWorkflow };

/** What Claude drafted, what is left to fill in, and the way to the editor. */
export const DraftSummary = memo(({ draft }: DraftSummaryProps) => {
  const { t } = useTranslation(["workflows", "editor"]);

  return (
    <div className="flex flex-col gap-2 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-2) p-4">
      <p className="font-medium">{draft.name}</p>
      <p className="text-sm whitespace-pre-line">{draft.summary}</p>
      {draft.issues.length > 0 && (
        <div className="text-sm">
          <p className="font-medium">{t("describe.left")}</p>
          <ul className="list-disc pl-5 text-(--color-text-muted)">
            {draft.issues.map((issue, index) => (
              <li key={index}>
                {issue.nodeId && (
                  <span className="font-mono">{issue.nodeId}: </span>
                )}
                {t(`editor:issues.${issue.code}`, {
                  field: issue.field,
                  defaultValue: issue.message,
                })}
              </li>
            ))}
          </ul>
        </div>
      )}
      <Link
        to={`/workflows/${draft.id}`}
        className="inline-flex items-center gap-1 self-start font-medium text-(--color-primary) hover:underline"
      >
        {t("describe.open")}
        <FiArrowRight aria-hidden="true" />
      </Link>
    </div>
  );
});

DraftSummary.displayName = "DraftSummary";
