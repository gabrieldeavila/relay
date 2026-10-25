import type { z } from 'zod';

/** What a tool hands back: text for the AI, optionally a PNG it can look at. */
export interface McpToolResult {
  text: string;
  image?: Buffer;
  data?: unknown;
}

/** A tool as Relay's MCP server exposes it; each module builds its own list. */
export interface McpTool {
  name: string;
  title: string;
  description: string;
  input: z.ZodRawShape;
  readOnly?: boolean;
  run(input: Record<string, unknown>): McpToolResult | Promise<McpToolResult>;
}
