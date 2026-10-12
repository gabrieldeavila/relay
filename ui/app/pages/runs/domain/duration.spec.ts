import { describe, expect, it } from "vitest";

import { formatDuration } from "./duration";

describe("formatDuration", () => {
  it.each([
    [850, "850 ms"],
    [4_200, "4.2 s"],
    [42_000, "42 s"],
    [185_000, "3 min 5 s"],
    [7_800_000, "2 h 10 min"],
    [273_600_000, "3 d 4 h"],
  ])("%d ms → %s", (ms, text) => {
    expect(formatDuration(ms)).toBe(text);
  });
});
