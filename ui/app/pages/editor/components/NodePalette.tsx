import { memo, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiSearch } from "react-icons/fi";
import { Link } from "react-router";

import { Input } from "@/ui/components/primitives/input";
import type { CatalogNode } from "@/app/flow/domain/types";
import { useNodeText } from "@/app/flow/hooks/useNodeText";
import { paletteGroups } from "../domain/palette-groups";

type NodePaletteProps = {
  nodes: CatalogNode[];
  hasTrigger: boolean;
  onAdd: (node: CatalogNode) => void;
};

/** Click to add; connected apps get their own sections, and search narrows it all. */
export const NodePalette = memo(
  ({ nodes, hasTrigger, onAdd }: NodePaletteProps) => {
    const { t } = useTranslation("editor");
    const text = useNodeText();
    const [query, setQuery] = useState("");
    const groups = useMemo(
      () => paletteGroups(nodes, { hasTrigger, query, titleOf: text.title }),
      [nodes, hasTrigger, query, text],
    );

    return (
      <nav aria-label={t("palette.title")} className="flex flex-col gap-4 p-3">
        <h2 className="text-sm font-semibold">{t("palette.title")}</h2>
        <Input
          aria-label={t("palette.search")}
          placeholder={t("palette.search")}
          leftIcon={<FiSearch aria-hidden="true" />}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {groups.map((group) => (
          <section key={group.key} className="flex flex-col gap-1">
            <h3 className="text-xs uppercase tracking-wide text-(--color-text-muted)">
              {group.isApp ? group.key : t(`palette.${group.key}`)}
            </h3>
            {group.items.map((node) => (
              <button
                key={node.type}
                type="button"
                onClick={() => onAdd(node)}
                className="rounded-(--radius-sm) px-2 py-1.5 text-left transition-colors hover:bg-(--color-surface-2) focus-visible:outline-2 focus-visible:outline-(--color-primary)"
              >
                <span className="block text-sm">{text.title(node)}</span>
                <span className="line-clamp-2 block text-xs text-(--color-text-muted)">
                  {text.description(node)}
                </span>
              </button>
            ))}
          </section>
        ))}
        {groups.length === 0 && (
          <p className="text-sm text-(--color-text-muted)">
            {t("palette.noMatch")}
          </p>
        )}
        <Link
          to="/connections"
          className="text-sm text-(--color-primary) hover:underline"
        >
          {t("palette.connect")}
        </Link>
      </nav>
    );
  },
);

NodePalette.displayName = "NodePalette";
