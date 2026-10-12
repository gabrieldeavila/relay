import { parseToolCatalog, type ToolDescriptor } from './tool-catalog.js';

/** A tool as an MCP server lists it (`tools/list`). */
export interface McpToolListing {
  name: string;
  title?: string;
  description?: string;
  inputSchema: Record<string, unknown>;
}

/** MCP tools in the same shape as Pincel's catalog, so both become nodes alike. */
export function catalogFromMcp(tools: McpToolListing[]): ToolDescriptor[] {
  return parseToolCatalog(
    tools.map((tool) => ({
      name: tool.name,
      description: tool.description ?? tool.title ?? '',
      input_schema: tool.inputSchema,
    })),
  );
}
