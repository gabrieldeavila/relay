import { memo } from "react";
import { useTranslation } from "react-i18next";

import type { CatalogNode } from "../domain/types";
import { useNodeText } from "../hooks/useNodeText";

type NodePaletteProps = {
  nodes: CatalogNode[];
  hasTrigger: boolean;
  onAdd: (node: CatalogNode) => void;
};

/** Click to add; a flow has one start, so starts hide once one is placed. */
export const NodePalette = memo(({ nodes, hasTrigger, onAdd }: NodePaletteProps) => {
  const { t } = useTranslation("editor");
  const text = useNodeText();
  const groups = [
    { key: "triggers", items: hasTrigger ? [] : nodes.filter((n) => n.kind === "trigger") },
    { key: "actions", items: nodes.filter((n) => n.kind === "action") },
  ].filter((group) => group.items.length);

  return (
    <nav aria-label={t("palette.title")} className="flex flex-col gap-4 p-3">
      <h2 className="text-sm font-semibold">{t("palette.title")}</h2>
      {groups.map((group) => (
        <section key={group.key} className="flex flex-col gap-1">
          <h3 className="text-xs uppercase tracking-wide text-(--color-text-muted)">
            {t(`palette.${group.key}`)}
          </h3>
          {group.items.map((node) => (
            <button
              key={node.type}
              type="button"
              onClick={() => onAdd(node)}
              className="rounded-(--radius-sm) px-2 py-1.5 text-left transition-colors hover:bg-(--color-surface-2) focus-visible:outline-2 focus-visible:outline-(--color-primary)"
            >
              <span className="block text-sm">{text.title(node)}</span>
              <span className="block text-xs text-(--color-text-muted)">{text.description(node)}</span>
            </button>
          ))}
        </section>
      ))}
    </nav>
  );
});

NodePalette.displayName = "NodePalette";
