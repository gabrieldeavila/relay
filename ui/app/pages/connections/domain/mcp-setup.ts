/** The one command that adds Relay to Claude Code. */
export const claudeCodeCommand = (mcpUrl: string, token: string) =>
  `claude mcp add --transport http relay ${mcpUrl} --header "Authorization: Bearer ${token}"`;

/** For other MCP clients: the address and the header to send. */
export const authorizationHeader = (token: string) => `Bearer ${token}`;
