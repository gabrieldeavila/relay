import type { CatalogNode } from "@/app/flow/domain/types";

export interface PaletteGroup {
  /** `triggers`, `actions`, or a connected app's name. */
  key: string;
  isApp: boolean;
  items: CatalogNode[];
}

const fold = (text: string) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Palette sections: starts (hidden once the flow has one), built-in steps,
 * then one section per connected app. `query` filters by visible words.
 */
export function paletteGroups(
  nodes: CatalogNode[],
  {
    hasTrigger,
    query,
    titleOf,
  }: {
    hasTrigger: boolean;
    query: string;
    titleOf: (node: CatalogNode) => string;
  },
): PaletteGroup[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  const matches = (node: CatalogNode) => {
    const text = fold(`${titleOf(node)} ${node.description} ${node.type}`);
    return words.every((word) => text.includes(word));
  };
  // Steps whose name matches come before those matching only in the description.
  const titleMatches = (node: CatalogNode) =>
    words.every((word) => fold(titleOf(node)).includes(word));
  const visible = nodes
    .filter(matches)
    .sort((a, b) => Number(titleMatches(b)) - Number(titleMatches(a)));
  const apps = [
    ...new Set(
      visible.map((node) => node.group).filter((g): g is string => Boolean(g)),
    ),
  ];

  return [
    {
      key: "triggers",
      isApp: false,
      items: hasTrigger ? [] : visible.filter((n) => n.kind === "trigger"),
    },
    {
      key: "actions",
      isApp: false,
      items: visible.filter((n) => n.kind === "action" && !n.group),
    },
    ...apps.map((app) => ({
      key: app,
      isApp: true,
      items: visible.filter((n) => n.group === app),
    })),
  ].filter((group) => group.items.length > 0);
}
