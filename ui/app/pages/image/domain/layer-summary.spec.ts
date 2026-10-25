import { describe, expect, it } from "vitest";

import { layersTopFirst, layerSummary } from "./layer-summary";
import type { Layer } from "./types";

const layer = (over: Partial<Layer> = {}): Layer => ({
  id: "layer_1",
  name: "Photo",
  visible: true,
  opacity: 1,
  blendMode: "normal",
  mask: null,
  ...over,
});

describe("layerSummary", () => {
  it("is empty for a plain layer and lists what differs", () => {
    expect(layerSummary(layer())).toBe("");
    expect(
      layerSummary(
        layer({ opacity: 0.8, blendMode: "multiply", mask: { enabled: true } }),
      ),
    ).toBe("80% · multiply · mask");
  });

  it("orders layers top first without changing the input", () => {
    const layers = [layer({ id: "a" }), layer({ id: "b" })];
    expect(layersTopFirst(layers).map((l) => l.id)).toEqual(["b", "a"]);
    expect(layers[0].id).toBe("a");
  });
});
