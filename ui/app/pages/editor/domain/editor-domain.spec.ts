import { describe, expect, it } from "vitest";

import { groupIssues } from "./group-issues";
import { scheduleForFrequency, toggleWeekday } from "./schedule-form";
import type { WorkflowGraph } from "./types";

const at = { x: 0, y: 0 };
const graph: WorkflowGraph = {
  nodes: ["start", "a", "b"].map((id) => ({ id, type: "x", config: {}, position: at })),
  edges: [{ id: "a.true->b", source: "a", sourcePort: "true", target: "b" }],
};

describe("groupIssues", () => {
  it("puts node, edge and cycle issues on their nodes", () => {
    const { byNode, general } = groupIssues(
      [
        { code: "no_trigger" },
        { code: "missing_config", nodeId: "a", field: "url" },
        { code: "invalid_port", edgeId: "a.true->b", field: "true" },
        { code: "cycle", path: ["a", "b"] },
      ],
      graph,
    );
    expect(general).toEqual([{ code: "no_trigger" }]);
    expect(byNode.get("a")?.map((issue) => issue.code)).toEqual([
      "missing_config",
      "invalid_port",
      "cycle",
    ]);
    expect(byNode.get("b")?.map((issue) => issue.code)).toEqual(["cycle"]);
  });
});

describe("scheduleForFrequency", () => {
  it("keeps the chosen time and zone when switching frequency", () => {
    expect(
      scheduleForFrequency("week", { every: "day", time: "07:30", timezone: "Europe/Lisbon" }),
    ).toEqual({ every: "week", weekdays: ["mon"], time: "07:30", timezone: "Europe/Lisbon" });
  });

  it("drops the time for frequencies without one", () => {
    expect(scheduleForFrequency("minutes", { every: "day", time: "07:30" })).toEqual({
      every: "minutes",
      interval: 15,
    });
  });
});

describe("toggleWeekday", () => {
  it("keeps weekdays in calendar order", () => {
    expect(toggleWeekday(["fri"], "mon")).toEqual(["mon", "fri"]);
    expect(toggleWeekday(["mon", "fri"], "mon")).toEqual(["fri"]);
  });
});
