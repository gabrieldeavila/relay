import type { ToolReply } from './tool-reply.js';

/** The parts of an MCP `tools/call` result a step uses. */
export interface McpCallResult {
  content?: { type: string; text?: string; data?: string; mimeType?: string }[];
  structuredContent?: unknown;
  isError?: boolean;
}

export type McpReadResult =
  { ok: true; reply: ToolReply } | { ok: false; message: string };

/**
 * An MCP result as a step output: text blocks joined, structured content as
 * `data`, the first image saved like Pincel's. `isError` means the tool ran
 * and said no, with the reason in its text.
 */
export function readMcpResult(result: McpCallResult): McpReadResult {
  const blocks = result.content ?? [];
  const text = blocks
    .filter((block) => block.type === 'text')
    .map((block) => block.text ?? '')
    .join('\n')
    .trim();
  if (result.isError) {
    return { ok: false, message: text || 'The tool reported an error' };
  }
  const image = blocks.find((block) => block.type === 'image' && block.data);
  return {
    ok: true,
    reply: {
      text,
      data: result.structuredContent ?? null,
      ...(image
        ? { image: image.data, imageMimeType: image.mimeType ?? 'image/png' }
        : {}),
    },
  };
}
