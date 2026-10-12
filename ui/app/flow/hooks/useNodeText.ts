import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { humanizeName, isToolType } from "../domain/humanize-name";
import type { CatalogNode, GraphIssue } from "../domain/types";

/** Translated names for node types, fields, options, ports and issues. */
export const useNodeText = () => {
  const { t } = useTranslation(["nodes", "editor"]);

  const title = useCallback(
    (node: CatalogNode | undefined, fallback = "?") => {
      if (!node) return fallback;
      return isToolType(node.type)
        ? node.title
        : t(`nodes:${node.type}.title`, { defaultValue: node.title });
    },
    [t],
  );
  const description = useCallback(
    (node: CatalogNode) =>
      isToolType(node.type)
        ? node.description
        : t(`nodes:${node.type}.description`, {
            defaultValue: node.description,
          }),
    [t],
  );
  const field = useCallback(
    (name: string) =>
      t(`nodes:fields.${name}`, { defaultValue: humanizeName(name) }),
    [t],
  );
  /** Help under a built-in step's field; connected apps describe their own. */
  const hint = useCallback(
    (name: string): string | undefined =>
      t(`nodes:hints.${name}`, { defaultValue: "" }) || undefined,
    [t],
  );
  const option = useCallback(
    (value: string) => t(`nodes:options.${value}`, { defaultValue: value }),
    [t],
  );
  const port = useCallback(
    (name: string) => t(`nodes:ports.${name}`, { defaultValue: name }),
    [t],
  );
  const issue = useCallback(
    (item: GraphIssue) =>
      t(`editor:issues.${item.code}`, {
        field: item.field ? field(item.field) : "",
      }),
    [t, field],
  );

  return { title, description, field, hint, option, port, issue };
};
