import { describe, expect, it } from "vitest";

import { recordFromRows, rowsFromRecord } from "./key-value-rows";

describe("key/value rows", () => {
  it("round-trips a record", () => {
    const record = { title: "Sale", sizes: [1, 2] };
    expect(recordFromRows(rowsFromRecord(record), "any")).toEqual(record);
  });

  it("skips rows without a name and trims names", () => {
    expect(
      recordFromRows(
        [
          { name: " x-key ", value: "abc" },
          { name: "", value: "half typed" },
        ],
        "text",
      ),
    ).toEqual({ "x-key": "abc" });
  });

  it("keeps JSON as text for text-only values", () => {
    expect(recordFromRows([{ name: "a", value: "[1]" }], "text")).toEqual({ a: "[1]" });
  });

  it("starts empty for anything that is not an object", () => {
    expect(rowsFromRecord(undefined)).toEqual([]);
    expect(rowsFromRecord(["a"])).toEqual([]);
  });
});
