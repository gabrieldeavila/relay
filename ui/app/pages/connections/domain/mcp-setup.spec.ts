import { describe, expect, it } from "vitest";

import { authorizationHeader, claudeCodeCommand } from "./mcp-setup";

describe("MCP setup", () => {
  it("builds the Claude Code command with the token as a header", () => {
    expect(claudeCodeCommand("http://localhost:4400/mcp", "relay_abc")).toBe(
      'claude mcp add --transport http relay http://localhost:4400/mcp --header "Authorization: Bearer relay_abc"',
    );
    expect(authorizationHeader("relay_abc")).toBe("Bearer relay_abc");
  });
});
