import { describe, expect, it } from "vitest";

import { nextNodePosition } from "./canvas-layout";

describe("nextNodePosition", () => {
  it("starts at the origin and then goes right of the rightmost node", () => {
    expect(nextNodePosition({ nodes: [], edges: [] })).toEqual({ x: 0, y: 0 });
    expect(
      nextNodePosition({
        nodes: [
          { id: "a", type: "x", config: {}, position: { x: 300, y: 40 } },
          { id: "b", type: "x", config: {}, position: { x: 0, y: 0 } },
        ],
        edges: [],
      }),
    ).toEqual({ x: 600, y: 40 });
  });
});
