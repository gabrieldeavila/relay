import { describe, expect, it } from "vitest";

import { formatDuration } from "./duration";
import { focusStep } from "./focus-step";
import { parseSse } from "./sse-parser";
import { stepStatuses } from "./step-statuses";
import type { RunDetail, RunStep } from "./types";
import { waitingAction } from "./waiting-action";
import { withLiveStatus } from "./with-live-status";

const at = { x: 0, y: 0 };
const step = (
  nodeId: string,
  status: RunStep["status"],
  extra: Partial<RunStep> = {},
) =>
  ({
    nodeId,
    status,
    waitingFor: null,
    runAt: "2026-10-12T12:00:00Z",
    ...extra,
  }) as RunStep;
const run = (status: RunDetail["status"], steps: RunStep[]) =>
  ({
    status,
    resumeToken: "tok",
    graph: {
      nodes: ["start", "ask", "post"].map((id) => ({
        id,
        type: "x",
        config: {},
        position: at,
      })),
      edges: [],
    },
    steps,
  }) as unknown as RunDetail;

describe("parseSse", () => {
  it("returns complete events and keeps the unfinished tail", () => {
    expect(
      parseSse(
        '\nevent: run\ndata: {"a":1}\n\nevent: ping\ndata: \n\nevent: ru',
      ),
    ).toEqual({
      events: [
        { event: "run", data: '{"a":1}' },
        { event: "ping", data: "" },
      ],
      rest: "event: ru",
    });
  });

  it("joins multi-line data and handles CRLF", () => {
    expect(parseSse("data: a\r\ndata: b\r\n\r\n").events).toEqual([
      { event: "message", data: "a\nb" },
    ]);
  });
});

describe("stepStatuses", () => {
  it("shows steps not created yet as pending while the run goes on", () => {
    expect([
      ...stepStatuses(
        run("waiting", [step("start", "succeeded"), step("ask", "waiting")]),
      ),
    ]).toEqual([
      ["start", "succeeded"],
      ["ask", "waiting"],
      ["post", "pending"],
    ]);
  });

  it("shows them as not reached once the run ended", () => {
    expect(
      stepStatuses(
        run("failed", [step("start", "succeeded"), step("ask", "failed")]),
      ).get("post"),
    ).toBe("not_reached");
  });
});

describe("waitingAction", () => {
  const detail = run("waiting", []);

  it("offers approve and reject links for approvals", () => {
    expect(
      waitingAction(
        detail,
        step("ask", "waiting", { waitingFor: "event" }),
        "flow.approval",
        "http://api",
      ),
    ).toEqual({
      kind: "approval",
      approveUrl: "http://api/resume/tok/ask/approve",
      rejectUrl: "http://api/resume/tok/ask/reject",
    });
  });

  it("gives the link other apps call, or the wake-up time of a delay", () => {
    expect(
      waitingAction(
        detail,
        step("hook", "waiting", { waitingFor: "event" }),
        "flow.wait_for_webhook",
        "http://api",
      ),
    ).toEqual({
      kind: "webhook",
      url: "http://api/resume/tok/hook",
    });
    expect(
      waitingAction(
        detail,
        step("pause", "waiting", { waitingFor: "time" }),
        "flow.delay",
        "http://api",
      ),
    ).toEqual({
      kind: "timer",
      until: "2026-10-12T12:00:00Z",
    });
  });

  it("has nothing for steps that are not waiting", () => {
    expect(
      waitingAction(detail, step("post", "running"), "data.set", "http://api"),
    ).toBeNull();
  });
});

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

describe("focusStep", () => {
  it("prefers a waiting step, then the failure that stopped the run", () => {
    expect(
      focusStep(
        run("waiting", [step("start", "succeeded"), step("ask", "waiting")]),
      ),
    ).toBe("ask");
    expect(
      focusStep(
        run("failed", [
          step("call", "failed", { port: "error" }),
          step("post", "failed"),
        ]),
      ),
    ).toBe("post");
    expect(
      focusStep(run("succeeded", [step("start", "succeeded")])),
    ).toBeNull();
  });
});

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
