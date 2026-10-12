import { describe, expect, it } from "vitest";

import { humanizeName, isToolType } from "./humanize-name";

describe("humanizeName", () => {
  it("turns code names into labels", () => {
    expect(humanizeName("maxSize")).toBe("Max size");
    expect(humanizeName("font_family")).toBe("Font family");
    expect(humanizeName("url")).toBe("Url");
  });
});

describe("isToolType", () => {
  it("recognizes nodes from connected apps", () => {
    expect(isToolType("tool:p1:draw_text")).toBe(true);
    expect(isToolType("http.request")).toBe(false);
  });
});
