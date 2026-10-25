import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import type { McpTool } from '../domain/mcp-tool.js';
import { errorResult, toCallToolResult } from '../domain/tool-result.js';

/** Registers tools on a server; input is validated (defaults applied) before running. */
export function registerMcpTools(server: McpServer, tools: McpTool[]) {
  for (const tool of tools) {
    const schema = z.object(tool.input);
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: schema,
        annotations: {
          readOnlyHint: tool.readOnly ?? false,
          destructiveHint: false,
        },
      },
      async (args: unknown) => {
        try {
          return toCallToolResult(await tool.run(schema.parse(args ?? {})));
        } catch (error) {
          return errorResult(describeError(error));
        }
      },
    );
  }
}

function describeError(error: unknown) {
  if (error instanceof z.ZodError) return z.prettifyError(error);
  return error instanceof Error ? error.message : String(error);
}
