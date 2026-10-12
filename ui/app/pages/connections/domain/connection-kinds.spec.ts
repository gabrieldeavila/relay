import { describe, expect, it } from "vitest";

import {
  connectionDefaults,
  isCommand,
  newConnection,
} from "./connection-kinds";

describe("newConnection", () => {
  it("sends a URL for apps and MCP servers over HTTP", () => {
    expect(
      newConnection("mcp_http", " Notes ", " http://localhost:9/mcp "),
    ).toEqual({
      name: "Notes",
      kind: "mcp_http",
      baseUrl: "http://localhost:9/mcp",
    });
    expect(
      newConnection("tools_api", "Pincel", "http://localhost:4300"),
    ).toEqual({
      name: "Pincel",
      kind: "tools_api",
      baseUrl: "http://localhost:4300",
    });
  });

  it("sends a command for servers Relay starts", () => {
    expect(newConnection("mcp_stdio", "Files", "npx -y server ")).toEqual({
      name: "Files",
      kind: "mcp_stdio",
      command: "npx -y server",
    });
    expect(isCommand("mcp_stdio")).toBe(true);
    expect(isCommand("mcp_http")).toBe(false);
  });

  it("prefills Pincel only for Pincel-style apps", () => {
    expect(connectionDefaults("tools_api").name).toBe("Pincel");
    expect(connectionDefaults("mcp_stdio")).toEqual({ name: "", address: "" });
  });
});
