import { describe, expect, it } from "vitest";

import { focusStep } from "./focus-step";
import { stepStatuses } from "./step-statuses";
import type { RunDetail, RunStep } from "./types";
import { waitingAction } from "./waiting-action";

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
