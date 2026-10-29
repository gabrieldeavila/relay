import { describe, expect, it } from "vitest";

import { playStart } from "./play-start";

describe("playStart", () => {
  it("plays from the playhead", () => {
    expect(playStart(12.5, 60)).toBe(12.5);
  });

  it("starts over when the playhead is at the end", () => {
    expect(playStart(59.95, 60)).toBe(0);
    expect(playStart(60, 60)).toBe(0);
  });
});
