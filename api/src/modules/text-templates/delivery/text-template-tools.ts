import { z } from 'zod';
import type { McpTool } from '../../mcp-server/domain/mcp-tool.js';
import { findClip } from '../../videos/domain/apply-video-command.js';
import type { Timeline } from '../../videos/domain/timeline-types.js';
import { textStyleFields } from '../../videos/delivery/tools/video-fields.js';
import type { VideoProjects } from '../../videos/data/video-projects.js';
import type { TextTemplates } from '../data/text-templates.js';
import { templateFromStyle } from '../domain/template-from-style.js';
import type { ListedTemplate } from '../domain/text-template.js';

const SAVE_INPUT = {
  name: z.string().min(1).describe('e.g. "my brand"'),
  description: z.string().optional().describe('What it looks like'),
  videoId: z
    .string()
    .optional()
    .describe("With clipId: start from that text clip's look"),
  clipId: z.string().optional(),
  font: textStyleFields.font.optional(),
  weight: textStyleFields.weight.optional(),
  color: textStyleFields.color.optional(),
  stroke: textStyleFields.stroke.optional(),
  background: textStyleFields.background.optional(),
  uppercase: z.boolean().optional(),
};

/** `list_text_templates`, `save_text_template` and `delete_text_template`. */
export function textTemplateTools(
  templates: TextTemplates,
  projects: VideoProjects,
): McpTool[] {
  return [
    {
      name: 'list_text_templates',
      title: 'List text templates',
      description:
        'Text templates for add_text, auto_captions and apply_text_template: the built-in ones and the ones the person saved. Show the person the names so they can pick.',
      input: {},
      readOnly: true,
      async run() {
        const all = await templates.list();
        return { text: all.map(describeTemplate).join('\n'), data: all };
      },
    },
    {
      name: 'save_text_template',
      title: 'Save text template',
      description:
        'Saves a text look under a name to reuse later: from a text clip (videoId + clipId, e.g. after the person likes how it looks) and/or from the fields given. Saving an existing name replaces it.',
      input: SAVE_INPUT,
      async run(input) {
        const { name, description, videoId, clipId, ...overrides } = z
          .object(SAVE_INPUT)
          .parse(input);
        const base =
          videoId && clipId
            ? textClipLook(await timelineOf(videoId), clipId)
            : undefined;
        if (!base && !overrides.font) {
          throw new Error('Pass videoId + clipId, or at least a font.');
        }
        const template = templateFromStyle({
          name,
          description,
          base,
          overrides,
        });
        await templates.save(template);
        return {
          text: `Saved text template "${template.name}" (${template.description}).`,
          data: template,
        };
      },
    },
    {
      name: 'delete_text_template',
      title: 'Delete text template',
      description:
        'Deletes a saved text template (built-in ones stay). Clips already styled with it keep their look.',
      input: { name: z.string().min(1) },
      async run(input) {
        const name = z.string().parse(input.name);
        await templates.remove(name);
        return { text: `Deleted text template "${name}".` };
      },
    },
  ];

  async function timelineOf(videoId: string): Promise<Timeline> {
    return (await projects.get(videoId)).timeline;
  }
}

function textClipLook(timeline: Timeline, clipId: string) {
  const clip = findClip(timeline, clipId);
  if (clip.kind !== 'text') throw new Error(`${clipId} is not a text clip`);
  return { style: clip.style, text: clip.text };
}

function describeTemplate(template: ListedTemplate): string {
  const origin = template.builtIn ? 'built-in' : 'saved';
  return `${template.name} (${origin}, ${template.font}): ${template.description}`;
}
