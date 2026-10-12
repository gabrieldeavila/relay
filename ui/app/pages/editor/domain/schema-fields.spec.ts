import { describe, expect, it } from "vitest";

import { formatLooseValue, parseLooseValue } from "./loose-value";
import { schemaFields } from "./schema-fields";

describe("schemaFields", () => {
  it("maps the http request schema to form fields", () => {
    expect(
      schemaFields({
        type: "object",
        properties: {
          url: { type: "string", format: "uri" },
          method: { default: "GET", type: "string", enum: ["GET", "POST"] },
          headers: {
            default: {},
            type: "object",
            additionalProperties: { type: "string" },
          },
          body: {},
        },
        required: ["url"],
      }),
    ).toEqual([
      { name: "url", required: true, kind: "text", placeholder: "https://" },
      { name: "method", required: false, kind: "select", options: ["GET", "POST"] },
      { name: "headers", required: false, kind: "keyValue", valueKind: "text" },
      { name: "body", required: false, kind: "any" },
    ]);
  });

  it("recognizes numbers, free records and schedules", () => {
    expect(
      schemaFields({
        properties: {
          amount: { type: "number" },
          fields: { type: "object", additionalProperties: {} },
          schedule: {
            oneOf: [{ type: "object", properties: { every: { const: "day" } } }],
          },
        },
        required: ["amount", "fields", "schedule"],
      }).map(({ name, kind, valueKind }) => ({ name, kind, valueKind })),
    ).toEqual([
      { name: "amount", kind: "number", valueKind: undefined },
      { name: "fields", kind: "keyValue", valueKind: "any" },
      { name: "schedule", kind: "schedule", valueKind: undefined },
    ]);
  });
});

describe("loose values", () => {
  it("parses JSON objects and lists, keeps the rest as text", () => {
    expect(parseLooseValue('{"title": "Sale"}')).toEqual({ title: "Sale" });
    expect(parseLooseValue("[1, 2]")).toEqual([1, 2]);
    expect(parseLooseValue("10")).toBe("10");
    expect(parseLooseValue("{{ steps.a.output }}")).toBe("{{ steps.a.output }}");
    expect(parseLooseValue("{ broken")).toBe("{ broken");
  });

  it("formats stored values back for editing", () => {
    expect(formatLooseValue({ a: 1 })).toBe('{\n  "a": 1\n}');
    expect(formatLooseValue(10)).toBe("10");
    expect(formatLooseValue(undefined)).toBe("");
  });
});
