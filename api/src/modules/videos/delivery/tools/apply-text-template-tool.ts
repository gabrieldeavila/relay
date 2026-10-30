import { z } from 'zod';
import { templateField } from '../../../text-templates/delivery/text-template-fields.js';
import { restyleWithTemplate } from '../../../text-templates/domain/restyle-with-template.js';
import type { TextClip, Timeline } from '../../domain/timeline-types.js';
import { layerField } from './video-fields.js';
import { defineVideoEdit } from './video-edit-tool.js';

export const applyTextTemplateTool = defineVideoEdit({
  name: 'apply_text_template',
  title: 'Apply text template',
  description:
    'Restyles text clips with a text template (font, colors, outline, case), keeping their size, place and timing. Pass clipIds, or a layer to restyle every text clip on it (e.g. all auto_captions). One undo step.',
  input: {
    template: templateField,
    clipIds: z.array(z.string()).min(1).optional(),
    layer: layerField
      .optional()
      .describe('Restyle every text clip on this layer'),
  },
  async plan({ template: name, clipIds, layer }, timeline, deps) {
    const clips = targetClips(timeline, clipIds, layer);
    const template = await deps.templates.use(name);
    return {
      commands: clips.map((clip) => ({
        type: 'update_clip' as const,
        clipId: clip.id,
        changes: restyleWithTemplate(clip, template),
      })),
      text: `Applied template "${template.name}" to ${clips.length} text clip(s).`,
    };
  },
});

function targetClips(
  timeline: Timeline,
  clipIds: string[] | undefined,
  layer: number | undefined,
): TextClip[] {
  if (!clipIds && layer === undefined) {
    throw new Error('Pass clipIds or a layer.');
  }
  const texts = timeline.clips.filter(
    (clip): clip is TextClip => clip.kind === 'text',
  );
  const wrong = (clipIds ?? []).filter(
    (id) => !texts.some((clip) => clip.id === id),
  );
  if (wrong.length > 0) {
    throw new Error(`Not text clips: ${wrong.join(', ')}`);
  }
  const chosen = texts.filter(
    (clip) => clipIds?.includes(clip.id) || clip.layer === layer,
  );
  if (chosen.length === 0) throw new Error(`No text clips on layer ${layer}.`);
  return chosen;
}
