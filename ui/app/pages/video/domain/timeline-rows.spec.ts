import { describe, expect, it } from "vitest";

import { clipLabel, timeAt, timelineRows } from "./timeline-rows";
import type { TimelineClip } from "./types";

const clip = (over: Partial<TimelineClip>): TimelineClip => ({
  id: "clip_1",
  kind: "media",
  layer: 0,
  start: 0,
  end: 5,
  assetName: "beach.mp4",
  ...over,
});

describe("timelineRows", () => {
  it("groups clips by layer, top layer first, placed in percent", () => {
    const rows = timelineRows(
      [
        clip({}),
        clip({
          id: "clip_2",
          layer: 10,
          start: 2,
          end: 4,
          kind: "text",
          text: "Hi",
        }),
      ],
      10,
    );
    expect(rows.map((row) => row.layer)).toEqual([10, 0]);
    expect(rows[0].clips[0]).toMatchObject({
      leftPercent: 20,
      widthPercent: 20,
    });
    expect(rows[1].clips[0]).toMatchObject({
      leftPercent: 0,
      widthPercent: 50,
    });
  });

  it("handles an empty video", () => {
    expect(timelineRows([], 0)).toEqual([]);
  });
});

describe("labels and clicks", () => {
  it("labels clips by text or file", () => {
    expect(clipLabel(clip({ kind: "text", text: "Day 1" }))).toBe("“Day 1”");
    expect(clipLabel(clip({}))).toBe("beach.mp4");
  });

  it("turns a click position into a time inside the video", () => {
    expect(timeAt(0.5, 10)).toBe(5);
    expect(timeAt(1.2, 10)).toBe(9.99);
    expect(timeAt(-1, 10)).toBe(0);
  });
});
