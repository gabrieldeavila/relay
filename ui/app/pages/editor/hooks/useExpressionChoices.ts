import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { expressionOptions } from "../domain/expression-options";
import type { CatalogNode, WorkflowGraph } from "@/app/flow/domain/types";
import { useNodeText } from "@/app/flow/hooks/useNodeText";

export interface ExpressionChoice {
  label: string;
  expression: string;
}

/** Values the selected step can use, labelled in plain words. */
export const useExpressionChoices = (
  graph: WorkflowGraph,
  nodeId: string,
  catalog: Map<string, CatalogNode>,
): ExpressionChoice[] => {
  const { t } = useTranslation("editor");
  const text = useNodeText();

  return useMemo(() => {
    const typeOf = new Map(graph.nodes.map((node) => [node.id, node.type]));
    const options = expressionOptions(
      graph,
      nodeId,
      (type) => catalog.get(type)?.kind === "trigger",
      (type) => catalog.get(type)?.outputPorts.includes("error") ?? false,
    );
    return options.map((option) => {
      const node = option.nodeId
        ? catalog.get(typeOf.get(option.nodeId) ?? "")
        : undefined;
      const name = option.nodeId
        ? `${text.title(node)} (${option.nodeId})`
        : "";
      return {
        label: t(`expressions.${option.labelKey}`, { node: name }),
        expression: option.expression,
      };
    });
  }, [graph, nodeId, catalog, t, text]);
};
