import { z } from 'zod';
import type { McpTool } from '../../mcp-server/domain/mcp-tool.js';
import type { ImageDocuments } from '../data/image-documents.js';
import { imageWorkspaceTools } from './image-workspace-tools.js';
import { TOOLS } from './tools/tool-catalog.js';
import type { ToolDefinition } from './tools/tool-definition.js';

/** Generic names get an `_image` suffix next to their video counterparts. */
const RENAMED: Record<string, string> = {
  undo: 'undo_image',
  redo: 'redo_image',
  batch: 'batch_image',
};

/** Tools that work without a document (fonts, text measuring). */
const DOCUMENT_FREE = new Set(['load_font', 'list_fonts', 'measure_text']);

const imageIdField = z
  .string()
  .describe('The image to edit (from create_image, open_image or list_images)');

/** Every image tool for MCP: workspace tools plus the editor tools, which take an imageId. */
export function imageMcpTools(documents: ImageDocuments): McpTool[] {
  return [
    ...imageWorkspaceTools(documents),
    ...TOOLS.map((tool) => editorTool(tool, documents)),
  ];
}

function editorTool(tool: ToolDefinition, documents: ImageDocuments): McpTool {
  const needsDocument = !DOCUMENT_FREE.has(tool.name);
  return {
    name: RENAMED[tool.name] ?? tool.name,
    title: tool.title,
    description: tool.description,
    input: needsDocument
      ? { imageId: imageIdField, ...tool.input }
      : tool.input,
    readOnly: tool.readOnly,
    async run({ imageId, ...input }) {
      const engine = needsDocument
        ? await documents.engine(imageId as string)
        : undefined;
      return tool.run(input, {
        engine: engine!,
        fonts: documents.fonts,
        assets: documents.assets,
        source: 'mcp',
      });
    },
  };
}
