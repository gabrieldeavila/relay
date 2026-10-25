import { describe, expect, it } from "vitest";

import { thumbnailAspect } from "./aspect-ratio";

describe("thumbnailAspect", () => {
  it("keeps the real ratio within 9:16 to 16:9", () => {
    expect(thumbnailAspect(1080, 1080)).toBe("1");
    expect(thumbnailAspect(1080, 1920)).toBe("0.563");
    expect(thumbnailAspect(4000, 500)).toBe("1.778");
  });
});
