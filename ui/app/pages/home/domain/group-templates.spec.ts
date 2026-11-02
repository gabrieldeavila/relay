import { describe, expect, it } from "vitest";

import type { DesignTemplateEntry } from "./design-template";
import { groupTemplates, humanize } from "./group-templates";

const entry = (name: string, category: string): DesignTemplateEntry => ({
  name,
  category,
  description: "",
  width: 1080,
  height: 1080,
  builtIn: true,
  fields: [],
});

describe("groupTemplates", () => {
  it("groups by category in first-seen order", () => {
    const groups = groupTemplates([
      entry("a", "instagram-post"),
      entry("b", "poster"),
      entry("c", "instagram-post"),
    ]);
    expect(groups.map((g) => g.category)).toEqual(["instagram-post", "poster"]);
    expect(groups[0].templates.map((t) => t.name)).toEqual(["a", "c"]);
  });
});

describe("humanize", () => {
  it("turns keys into readable names", () => {
    expect(humanize("bold-announcement")).toBe("Bold announcement");
    expect(humanize("youtube_thumbnail")).toBe("Youtube thumbnail");
  });
});
