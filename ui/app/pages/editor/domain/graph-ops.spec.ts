import { describe, expect, it } from "vitest";

import { addNode, connect, removeNodes } from "./graph-ops";
import { nextNodeId } from "./node-id";
import type { CatalogNode, WorkflowGraph } from "./types";

const http: CatalogNode = {
  type: "http.request",
  kind: "action",
  title: "Call a web address",
  description: "",
  outputPorts: ["out", "error"],
  configSchema: {
    type: "object",
    properties: {
      url: { type: "string" },
      method: { type: "string", default: "GET" },
    },
  },
};
const at = { x: 0, y: 0 };
const empty: WorkflowGraph = { nodes: [], edges: [] };

describe("nextNodeId", () => {
  it("uses the last part of the type and numbers repeats", () => {
    expect(nextNodeId("http.request", [])).toBe("request");
    expect(nextNodeId("http.request", ["request", "request-2"])).toBe("request-3");
    expect(nextNodeId("flow.wait_for_webhook", [])).toBe("wait_for_webhook");
  });
});

describe("addNode", () => {
  it("fills config defaults from the schema", () => {
    const { id, graph } = addNode(empty, http, at);
    expect(id).toBe("request");
    expect(graph.nodes[0].config).toEqual({ method: "GET" });
  });
});

describe("connect", () => {
  const twoNodes: WorkflowGraph = {
    nodes: [
      { id: "start", type: "trigger.manual", config: {}, position: at },
      { id: "call", type: "http.request", config: {}, position: at },
    ],
    edges: [],
  };
  const isTrigger = (id: string) => id === "start";

  it("adds an edge from a port", () => {
    const graph = connect(twoNodes, { source: "call", sourcePort: "error", target: "start" }, () => false);
    expect(graph.edges).toEqual([
      { id: "call.error->start", source: "call", sourcePort: "error", target: "start" },
    ]);
  });

  it("ignores self loops, edges into the trigger and duplicates", () => {
    expect(connect(twoNodes, { source: "call", sourcePort: "out", target: "call" }, isTrigger)).toBe(twoNodes);
    expect(connect(twoNodes, { source: "call", sourcePort: "out", target: "start" }, isTrigger)).toBe(twoNodes);
    const once = connect(twoNodes, { source: "start", sourcePort: "out", target: "call" }, isTrigger);
    expect(connect(once, { source: "start", sourcePort: "out", target: "call" }, isTrigger)).toBe(once);
  });
});

describe("removeNodes", () => {
  it("drops the edges touching removed nodes", () => {
    const graph: WorkflowGraph = {
      nodes: ["a", "b", "c"].map((id) => ({ id, type: "x", config: {}, position: at })),
      edges: [
        { id: "a->b", source: "a", sourcePort: "out", target: "b" },
        { id: "b->c", source: "b", sourcePort: "out", target: "c" },
      ],
    };
    expect(removeNodes(graph, ["c"]).edges.map((edge) => edge.id)).toEqual(["a->b"]);
  });
});
