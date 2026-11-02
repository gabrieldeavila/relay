import { z } from 'zod';
import type { McpTool } from '../../mcp-server/domain/mcp-tool.js';
import type { ImageDocuments } from '../../images/data/image-documents.js';
import { templateKey } from '../../text-templates/domain/template-name.js';
import type { ImageTemplates } from '../data/image-templates.js';
import type { ListedImageTemplate } from '../domain/image-template.js';
import { PLACEHOLDER_HELP } from '../domain/template-placeholders.js';
import { applyImageTemplateTool } from './apply-image-template-tool.js';
import { checkTemplateSteps } from './check-template-steps.js';

const SAVE_INPUT = {
  name: z.string().min(1).describe('e.g. "my look"'),
  description: z.string().min(1).describe('What it does, shown when listing'),
  steps: z
    .array(
      z.object({
        tool: z.string().describe('An image tool, as in batch_image'),
        input: z.record(z.string(), z.unknown()).default({}),
      }),
    )
    .min(1)
    .max(100)
    .describe(
      `The tool calls, in order, as in batch_image. Use placeholders so it fits any image: ${PLACEHOLDER_HELP}. Steps without layerId use the active layer, which starts as $layer; add_layer makes its new layer active.`,
    ),
};

/** `list_image_templates`, `apply_image_template`, `save_image_template` and `delete_image_template`. */
export function imageTemplateTools(
  templates: ImageTemplates,
  documents: ImageDocuments,
): McpTool[] {
  return [
    {
      name: 'list_image_templates',
      title: 'List image templates',
      description:
        'Image templates for apply_image_template (photo looks like vintage, noir, cinematic): the built-in ones and the ones the person saved. Show the person the names so they can pick. Pass verbose to see the steps.',
      input: { verbose: z.boolean().default(false) },
      readOnly: true,
      async run(input) {
        const verbose = z.boolean().default(false).parse(input.verbose);
        const all = await templates.list();
        return {
          text: all.map((t) => describeTemplate(t, verbose)).join('\n'),
          data: all,
        };
      },
    },
    applyImageTemplateTool(templates, documents),
    {
      name: 'save_image_template',
      title: 'Save image template',
      description:
        'Saves an edit under a name to reuse on other images, e.g. a look the person liked or one they describe. Steps are checked before saving. Saving an existing name replaces it.',
      input: SAVE_INPUT,
      async run(input) {
        const { name, description, steps } = z.object(SAVE_INPUT).parse(input);
        checkTemplateSteps(steps);
        const template = { name: templateKey(name), description, steps };
        await templates.save(template);
        return {
          text: `Saved image template "${template.name}" (${steps.length} steps).`,
          data: template,
        };
      },
    },
    {
      name: 'delete_image_template',
      title: 'Delete image template',
      description:
        'Deletes a saved image template (built-in ones stay). Images it was applied to keep their edits.',
      input: { name: z.string().min(1) },
      async run(input) {
        const name = z.string().parse(input.name);
        await templates.remove(name);
        return { text: `Deleted image template "${name}".` };
      },
    },
  ];
}

function describeTemplate(
  template: ListedImageTemplate,
  verbose: boolean,
): string {
  const origin = template.builtIn ? 'built-in' : 'saved';
  const line = `${template.name} (${origin}): ${template.description}`;
  return verbose ? `${line}\n  ${JSON.stringify(template.steps)}` : line;
}
