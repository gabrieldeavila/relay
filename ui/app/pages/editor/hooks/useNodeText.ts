import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import type { CatalogNode, GraphIssue } from "../domain/types";

/** Translated names for node types, fields, options, ports and issues. */
export const useNodeText = () => {
  const { t } = useTranslation(["nodes", "editor"]);

  const title = useCallback(
    (node: CatalogNode | undefined, fallback = "?") =>
      node ? t(`nodes:${node.type}.title`, { defaultValue: node.title }) : fallback,
    [t],
  );
  const description = useCallback(
    (node: CatalogNode) => t(`nodes:${node.type}.description`, { defaultValue: node.description }),
    [t],
  );
  const field = useCallback(
    (name: string) => t(`nodes:fields.${name}`, { defaultValue: name }),
    [t],
  );
  const option = useCallback(
    (value: string) => t(`nodes:options.${value}`, { defaultValue: value }),
    [t],
  );
  const port = useCallback((name: string) => t(`nodes:ports.${name}`, { defaultValue: name }), [t]);
  const issue = useCallback(
    (item: GraphIssue) =>
      t(`editor:issues.${item.code}`, { field: item.field ? field(item.field) : "" }),
    [t, field],
  );

  return { title, description, field, option, port, issue };
};
