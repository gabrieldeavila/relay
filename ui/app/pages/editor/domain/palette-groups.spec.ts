import { describe, expect, it } from "vitest";

import type { CatalogNode } from "@/app/flow/domain/types";
import { paletteGroups } from "./palette-groups";

const node = (
  type: string,
  kind: CatalogNode["kind"],
  title: string,
  group: string | null = null,
) =>
  ({
    type,
    kind,
    title,
    description: "",
    group,
    outputPorts: ["out"],
    configSchema: {},
  }) as CatalogNode;

const nodes = [
  node("trigger.manual", "trigger", "Iniciar manualmente"),
  node("http.request", "action", "Chamar um endereço web"),
  node("tool:p1:draw_text", "action", "Draw text", "Pincel"),
  node("tool:p1:render_image", "action", "Render image", "Pincel"),
];
const titleOf = (n: CatalogNode) => n.title;

describe("paletteGroups", () => {
  it("puts name matches before description-only matches", () => {
    const tools = [
      { ...node("tool:p1:load_font", "action", "Load font", "Pincel"), description: "so draw_text can use it" },
      node("tool:p1:draw_text", "action", "Draw text", "Pincel"),
    ];
    expect(
      paletteGroups(tools, { hasTrigger: true, query: "draw text", titleOf }).flatMap((g) => g.items.map((i) => i.title)),
    ).toEqual(["Draw text", "Load font"]);
  });

  it("lists starts, built-in steps and one section per app", () => {
    expect(
      paletteGroups(nodes, { hasTrigger: false, query: "", titleOf }).map(
        (g) => [g.key, g.items.length],
      ),
    ).toEqual([
      ["triggers", 1],
      ["actions", 1],
      ["Pincel", 2],
    ]);
  });

  it("hides starts once the flow has one", () => {
    expect(
      paletteGroups(nodes, { hasTrigger: true, query: "", titleOf }).map(
        (g) => g.key,
      ),
    ).toEqual(["actions", "Pincel"]);
  });

  it("searches every word, ignoring case and accents", () => {
    expect(
      paletteGroups(nodes, {
        hasTrigger: false,
        query: "ENDERECO web",
        titleOf,
      }).flatMap((g) => g.items.map((i) => i.type)),
    ).toEqual(["http.request"]);
    expect(
      paletteGroups(nodes, {
        hasTrigger: false,
        query: "image",
        titleOf,
      }).flatMap((g) => g.items.map((i) => i.type)),
    ).toEqual(["tool:p1:render_image"]);
  });
});
