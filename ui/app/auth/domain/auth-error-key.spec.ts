import { describe, expect, it } from "vitest";

import { authErrorKey } from "./auth-error-key";

describe("authErrorKey", () => {
  it("explains known errors", () => {
    expect(authErrorKey("invalid_credentials")).toBe("errors.invalid_credentials");
    expect(authErrorKey("weak_password")).toBe("errors.weak_password");
  });

  it("falls back for anything else", () => {
    expect(authErrorKey("over_request_rate_limit")).toBe("errors.unknown");
    expect(authErrorKey(undefined)).toBe("errors.unknown");
  });
});
