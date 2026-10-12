import { describe, expect, it } from "vitest";

import { outputImage } from "./output-image";

describe("outputImage", () => {
  it("finds the image a step produced", () => {
    const image = {
      url: "http://api/files/r/x-1.png",
      path: "/tmp/x-1.png",
      mimeType: "image/png",
    };
    expect(outputImage({ text: "Rendered", image })).toEqual({
      url: image.url,
      path: image.path,
    });
    expect(outputImage({ text: "Drew", image: null })).toBeNull();
    expect(outputImage("text")).toBeNull();
  });
});
