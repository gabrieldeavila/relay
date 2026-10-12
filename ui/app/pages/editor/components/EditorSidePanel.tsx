import { memo } from "react";
import { useTranslation } from "react-i18next";

import type { TriggerInfo } from "../api/editor-api";
import type { GroupedIssues } from "../domain/group-issues";
import type { CatalogNode, WorkflowGraph } from "../domain/types";
import { IssuesList } from "./IssuesList";
import { NodeConfigPanel } from "./NodeConfigPanel";
import { TriggerPanel } from "./TriggerPanel";

type EditorSidePanelProps = {
  graph: WorkflowGraph;
  catalog: Map<string, CatalogNode>;
  selectedId: string | null;
  grouped: GroupedIssues;
  trigger: TriggerInfo | null;
  published: boolean;
  onSelect: (nodeId: string) => void;
  onConfigChange: (nodeId: string, config: Record<string, unknown>) => void;
  onRemove: (nodeId: string) => void;
};

/** The selected step's settings, or the flow overview when nothing is selected. */
export const EditorSidePanel = memo((props: EditorSidePanelProps) => {
  const { t } = useTranslation("editor");
  const node = props.graph.nodes.find((candidate) => candidate.id === props.selectedId);

  if (node) {
    return (
      <NodeConfigPanel
        node={node}
        graph={props.graph}
        catalog={props.catalog}
        issues={props.grouped.byNode.get(node.id) ?? []}
        onChange={(config) => props.onConfigChange(node.id, config)}
        onRemove={() => props.onRemove(node.id)}
      />
    );
  }
  return (
    <div className="flex flex-col gap-4 p-4">
      <IssuesList grouped={props.grouped} onSelect={props.onSelect} />
      <TriggerPanel trigger={props.trigger} published={props.published} />
      <p className="text-sm text-(--color-text-muted)">{t("panel.nothingSelected")}</p>
    </div>
  );
});

EditorSidePanel.displayName = "EditorSidePanel";
