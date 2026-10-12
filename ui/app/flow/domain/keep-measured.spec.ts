import { describe, expect, it } from "vitest";

import { keepMeasured } from "./keep-measured";

describe("keepMeasured", () => {
  it("copies sizes by id and leaves new nodes unmeasured", () => {
    const size = { width: 200, height: 80 };
    expect(
      keepMeasured([{ id: "a" }, { id: "b" }], [{ id: "a", measured: size }]),
    ).toEqual([{ id: "a", measured: size }, { id: "b" }]);
  });
});
