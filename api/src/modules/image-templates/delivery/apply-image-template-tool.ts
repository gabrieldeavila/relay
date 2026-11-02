import { z } from 'zod';
import type { McpTool } from '../../mcp-server/domain/mcp-tool.js';
import type { ImageDocuments } from '../../images/data/image-documents.js';
import { nextLayerId } from '../../images/domain/document/layer-ids.js';
import { resolveLayer } from '../../images/delivery/tools/resolve-layer.js';
import { runTool } from '../../images/delivery/tools/run-tool.js';
import { findTool } from '../../images/delivery/tools/tool-catalog.js';
import type { ImageTemplates } from '../data/image-templates.js';
import { templateCalls } from '../domain/template-calls.js';

const INPUT = {
  imageId: z.string().describe('The image to edit'),
  template: z
    .string()
    .describe(
      'Image template name, e.g. "vintage", "noir", "cinematic" or one the person saved (list_image_templates)',
    ),
  layerId: z
    .string()
    .optional()
    .describe(
      'The layer to apply it to, usually the photo. Defaults to the active layer.',
    ),
  keepOriginal: z
    .boolean()
    .default(true)
    .describe(
      'Apply to a copy above the layer so the original stays untouched (lower the copy opacity for a weaker look)',
    ),
};

/** `apply_image_template`: runs a template's steps on a layer as one undo step. */
export function applyImageTemplateTool(
  templates: ImageTemplates,
  documents: ImageDocuments,
): McpTool {
  return {
    name: 'apply_image_template',
    title: 'Apply image template',
    description:
      'Applies an image template (a saved look or edit, like a photo filter preset) to a layer in one undo step. Check the result with render_image.',
    input: INPUT,
    async run(input) {
      const {
        imageId,
        template: name,
        layerId,
        keepOriginal,
      } = z.object(INPUT).parse(input);
      const template = await templates.get(name);
      const engine = await documents.engine(imageId);
      const target = resolveLayer(engine, layerId);
      const { meta } = engine.doc;
      const calls = templateCalls(template, {
        layerId: target,
        copyId: nextLayerId(meta),
        keepOriginal,
        width: meta.width,
        height: meta.height,
      });
      await engine.selectLayer(target);
      const result = await runTool(
        findTool('batch')!,
        { calls, label: `${template.name} template` },
        {
          engine,
          fonts: documents.fonts,
          assets: documents.assets,
          source: 'mcp',
        },
      );
      return {
        text: `Applied "${template.name}" to ${target}.\n${result.text}`,
      };
    },
  };
}
