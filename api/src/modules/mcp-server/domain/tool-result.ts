import type { McpToolResult } from './mcp-tool.js';

/** A tool's answer for MCP: its text, plus the PNG when it rendered one. */
export function toCallToolResult(result: McpToolResult) {
  const content: (
    | { type: 'text'; text: string }
    | { type: 'image'; data: string; mimeType: string }
  )[] = [{ type: 'text', text: result.text }];
  if (result.image) {
    content.push({
      type: 'image',
      data: result.image.toString('base64'),
      mimeType: 'image/png',
    });
  }
  return { content };
}

/** The tool ran but could not do it; the message tells the AI what to change. */
export const errorResult = (message: string) => ({
  content: [{ type: 'text' as const, text: message }],
  isError: true,
});
