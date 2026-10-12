import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FiTrash2 } from "react-icons/fi";

import { Alert } from "@/ui/components/primitives/alert";
import { Button } from "@/ui/components/primitives/button";
import { schemaFields } from "../domain/schema-fields";
import type {
  CatalogNode,
  GraphIssue,
  GraphNode,
  WorkflowGraph,
} from "@/app/flow/domain/types";
import { useExpressionChoices } from "../hooks/useExpressionChoices";
import { useNodeText } from "@/app/flow/hooks/useNodeText";
import { isToolType } from "@/app/flow/domain/humanize-name";
import { ConfigField } from "./fields/ConfigField";

type NodeConfigPanelProps = {
  node: GraphNode;
  graph: WorkflowGraph;
  catalog: Map<string, CatalogNode>;
  issues: GraphIssue[];
  onChange: (config: Record<string, unknown>) => void;
  onRemove: () => void;
};

export const NodeConfigPanel = memo((props: NodeConfigPanelProps) => {
  const { node, catalog, issues } = props;
  const { t } = useTranslation("editor");
  const text = useNodeText();
  const entry = catalog.get(node.type);
  const { hint } = text;
  const fields = useMemo(() => {
    if (!entry) return [];
    const described = schemaFields(entry.configSchema);
    return isToolType(entry.type)
      ? described
      : described.map((f) => ({ ...f, description: hint(f.name) }));
  }, [entry, hint]);
  const choices = useExpressionChoices(props.graph, node.id, catalog);

  const setField = (name: string, value: unknown) => {
    const { [name]: _previous, ...rest } = node.config;
    props.onChange(value === undefined ? rest : { ...rest, [name]: value });
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <header>
        <h2 className="text-lg font-semibold">{text.title(entry)}</h2>
        {entry && (
          <p className="text-sm text-(--color-text-muted)">
            {text.description(entry)}
          </p>
        )}
        <p className="mt-2 text-xs text-(--color-text-muted)">
          {t("panel.stepId")}: <code className="font-mono">{node.id}</code>
        </p>
      </header>
      {issues.map((issue, index) => (
        <Alert key={index} variant="danger">
          {text.issue(issue)}
        </Alert>
      ))}
      {/* Keyed by node so fields with local text reset when the selection changes. */}
      <div key={node.id} className="flex flex-col gap-4">
        {fields.map((field) => (
          <ConfigField
            key={field.name}
            field={field}
            label={text.field(field.name)}
            value={node.config[field.name]}
            onChange={(value) => setField(field.name, value)}
            choices={choices}
          />
        ))}
      </div>
      <Button
        variant="ghost"
        className="self-start"
        leftIcon={<FiTrash2 aria-hidden="true" />}
        onClick={props.onRemove}
      >
        {t("panel.remove")}
      </Button>
    </div>
  );
});

NodeConfigPanel.displayName = "NodeConfigPanel";
