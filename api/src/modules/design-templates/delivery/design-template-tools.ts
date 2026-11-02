import { z } from 'zod';
import type { McpTool } from '../../mcp-server/domain/mcp-tool.js';
import { templateKey } from '../../text-templates/domain/template-name.js';
import type { DesignTemplates } from '../data/design-templates.service.js';
import { describeDesign } from '../domain/describe-design.js';
import { checkDesign } from './check-design.js';
import { SAVE_DESIGN_INPUT } from './design-template-fields.js';

const CREATE_INPUT = {
  template: z.string().describe('Design template name (list_design_templates)'),
  fields: z
    .record(z.string(), z.string())
    .default({})
    .describe(
      'Field values by key, e.g. {"title":"BEACH DAY","photo":"~/Pictures/beach.jpg"}. Image fields take a path, URL or asset id; colors any CSS color. Left out = the default',
    ),
  name: z.string().optional().describe('Name of the new image'),
};

/** Canva-like templates: list, create from, save and delete. */
export function designTemplateTools(templates: DesignTemplates): McpTool[] {
  return [
    {
      name: 'list_design_templates',
      title: 'List design templates',
      description:
        'Ready-made designs (Instagram posts and stories, YouTube thumbnails, quote cards, posters, banners) with the fields each one takes. Show the person the options so they can pick.',
      input: {},
      readOnly: true,
      async run() {
        const all = await templates.registry.list();
        return { text: all.map(describeDesign).join('\n\n'), data: all };
      },
    },
    {
      name: 'create_from_design_template',
      title: 'Create from design template',
      description:
        "Makes a new image from a design template, filled with the person's texts, photos and colors. Each element is on its own named layer, so you can keep editing with the image tools. Texts are pixels: to change one, it's easiest to create again with new fields. Check with render_image.",
      input: CREATE_INPUT,
      async run(input) {
        const { template, fields, name } = z.object(CREATE_INPUT).parse(input);
        const created = await templates.create({
          template,
          fields,
          name,
          source: 'mcp',
        });
        const layers = created.engine.doc.meta.layers
          .map((layer) => `${layer.id} "${layer.name}"`)
          .join(', ');
        const fontNote = created.missingFonts.length
          ? `\nCouldn't download ${created.missingFonts.join(', ')}; a fallback font was used.`
          : '';
        return {
          text: `Created "${created.template.name}" as imageId ${created.id} (${created.template.width}x${created.template.height}). Layers: ${layers}.${fontNote}`,
          data: { imageId: created.id },
        };
      },
    },
    {
      name: 'save_design_template',
      title: 'Save design template',
      description:
        'Saves a design as a template the person can reuse, e.g. after they like one you made: the canvas, the fields they fill in and the tool calls that draw it. Checked before saving; it then shows in the Templates gallery of the Relay app. Saving an existing name replaces it.',
      input: SAVE_DESIGN_INPUT,
      async run(input) {
        const parsed = z.object(SAVE_DESIGN_INPUT).parse(input);
        const template = { ...parsed, name: templateKey(parsed.name) };
        checkDesign(template);
        await templates.registry.save(template);
        return {
          text: `Saved design template "${template.name}". Try it with create_from_design_template.`,
          data: template,
        };
      },
    },
    {
      name: 'delete_design_template',
      title: 'Delete design template',
      description:
        'Deletes a saved design template (built-in ones stay). Images made from it are kept.',
      input: { name: z.string().min(1) },
      async run(input) {
        const name = z.string().parse(input.name);
        await templates.registry.remove(name);
        return { text: `Deleted design template "${name}".` };
      },
    },
  ];
}
