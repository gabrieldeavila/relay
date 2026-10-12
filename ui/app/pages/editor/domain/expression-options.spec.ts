import { describe, expect, it } from "vitest";

import { expressionOptions } from "./expression-options";
import type { WorkflowGraph } from "./types";

const at = { x: 0, y: 0 };
// start → call → ask → post   (orphan is not upstream of post)
const graph: WorkflowGraph = {
  nodes: [
    { id: "start", type: "trigger.manual", config: {}, position: at },
    { id: "call", type: "http.request", config: {}, position: at },
    { id: "ask", type: "flow.approval", config: {}, position: at },
    { id: "post", type: "data.set", config: {}, position: at },
    { id: "orphan", type: "data.set", config: {}, position: at },
  ],
  edges: [
    { id: "1", source: "start", sourcePort: "out", target: "call" },
    { id: "2", source: "call", sourcePort: "out", target: "ask" },
    { id: "3", source: "ask", sourcePort: "approved", target: "post" },
  ],
};

describe("expressionOptions", () => {
  it("offers upstream values nearest first, plus the resume link", () => {
    expect(
      expressionOptions(
        graph,
        "post",
        (type) => type.startsWith("trigger."),
        (type) => type === "http.request",
      ).map((option) => option.expression),
    ).toEqual([
      "{{ steps.ask.output }}",
      "{{ steps.call.output }}",
      "{{ steps.call.error.message }}",
      "{{ trigger }}",
      "{{ run.resumeUrl }}",
    ]);
  });

  it("offers only the resume link to the first step", () => {
    expect(
      expressionOptions(graph, "start", () => true, () => false).map((o) => o.labelKey),
    ).toEqual(["resumeUrl"]);
  });
});
