import { describe, expect, it } from "vitest";

import { relativeTime } from "./relative-time";

const now = new Date("2026-10-12T12:00:00Z");
const ago = (seconds: number) => new Date(now.getTime() - seconds * 1000);

describe("relativeTime", () => {
  it("picks the largest whole unit", () => {
    expect(relativeTime(ago(5 * 60), now, "en")).toBe("5 minutes ago");
    expect(relativeTime(ago(26 * 3600), now, "en")).toBe("yesterday");
    expect(relativeTime(ago(3 * 86_400), now, "pt-BR")).toBe("há 3 dias");
  });

  it("says now for the last minute", () => {
    expect(relativeTime(ago(20), now, "en")).toBe("now");
  });
});
