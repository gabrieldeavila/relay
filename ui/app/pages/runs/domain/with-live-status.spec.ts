import { describe, expect, it } from "vitest";

import type { RunDetail } from "./types";
import { withLiveStatus } from "./with-live-status";

describe("withLiveStatus", () => {
  it("takes the open run's live status over the polled list", () => {
    const listed = [
      { id: "r1", status: "running", finishedAt: null },
      { id: "r2", status: "failed", finishedAt: "x" },
    ] as RunDetail[];
    const live = {
      id: "r1",
      status: "succeeded",
      finishedAt: "y",
    } as RunDetail;
    expect(withLiveStatus(listed, live).map((run) => run.status)).toEqual([
      "succeeded",
      "failed",
    ]);
    expect(withLiveStatus(listed, null)).toBe(listed);
  });
});
