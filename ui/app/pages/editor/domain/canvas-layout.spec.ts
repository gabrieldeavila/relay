import { describe, expect, it } from "vitest";

import { keepMeasured, nextNodePosition } from "./canvas-layout";

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

describe("keepMeasured", () => {
  it("copies sizes by id and leaves new nodes unmeasured", () => {
    const size = { width: 200, height: 80 };
    expect(
      keepMeasured([{ id: "a" }, { id: "b" }], [{ id: "a", measured: size }]),
    ).toEqual([{ id: "a", measured: size }, { id: "b" }]);
  });
});
