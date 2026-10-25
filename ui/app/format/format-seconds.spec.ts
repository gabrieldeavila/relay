import { describe, expect, it } from "vitest";

import { formatSeconds } from "./format-seconds";

describe("formatSeconds", () => {
  it("shows minutes and seconds, with tenths only when needed", () => {
    expect(formatSeconds(0)).toBe("0:00");
    expect(formatSeconds(3)).toBe("0:03");
    expect(formatSeconds(75.5)).toBe("1:15.5");
    expect(formatSeconds(-2)).toBe("0:00");
  });
});
