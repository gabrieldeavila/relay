import { describe, expect, it } from "vitest";

import { parseSse } from "./sse-parser";

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
