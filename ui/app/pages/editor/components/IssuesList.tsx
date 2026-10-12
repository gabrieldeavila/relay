import { memo } from "react";
import { useTranslation } from "react-i18next";

import { Alert } from "@/ui/components/primitives/alert";
import type { GroupedIssues } from "../domain/group-issues";
import { useNodeText } from "@/app/flow/hooks/useNodeText";

type IssuesListProps = {
  grouped: GroupedIssues;
  onSelect: (nodeId: string) => void;
};

/** Why the last publish was refused; each step links to itself on the canvas. */
export const IssuesList = memo(({ grouped, onSelect }: IssuesListProps) => {
  const { t } = useTranslation("editor");
  const text = useNodeText();
  const perNode = [...grouped.byNode.entries()];
  if (!grouped.general.length && !perNode.length) return null;

  return (
    <Alert variant="danger">
      <p className="font-medium">{t("issues.title")}</p>
      <ul className="mt-2 flex list-disc flex-col gap-1 pl-4 text-sm">
        {grouped.general.map((issue, index) => (
          <li key={`general-${index}`}>{text.issue(issue)}</li>
        ))}
        {perNode.map(([nodeId, issues]) => (
          <li key={nodeId}>
            <button
              type="button"
              className="font-mono underline"
              onClick={() => onSelect(nodeId)}
            >
              {nodeId}
            </button>
            : {issues.map((issue) => text.issue(issue)).join(" ")}
          </li>
        ))}
      </ul>
    </Alert>
  );
});

IssuesList.displayName = "IssuesList";
