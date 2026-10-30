import { z } from 'zod';
import { resolveTextStyle } from '../../../text-templates/domain/resolve-text-style.js';
import { templateText } from '../../../text-templates/domain/template-text-style.js';
import { templateField } from '../../../text-templates/delivery/text-template-fields.js';
import { defaultTextBox, layerEnd } from '../../domain/clip-placement.js';
import { clipEnd } from '../../domain/clip-timing.js';
import { nextClipId } from '../../domain/next-clip-id.js';
import type { TextClip } from '../../domain/timeline-types.js';
import { textNotes } from '../../data/render-text-overlay.js';
import {
  boxField,
  clipTimingFields,
  highlightField,
  layerField,
  textStyleFields,
} from './video-fields.js';
import { defineVideoEdit } from './video-edit-tool.js';

const TEXT_LAYER = 10;

export const addTextTool = defineVideoEdit({
  name: 'add_text',
  title: 'Add text',
  description: `Shows text (a title, a caption) for \`duration\` seconds. It is laid out inside box (default: a caption area in the lower part of the frame), wrapped to its width; fit="shrink" makes long text fit. Text goes on layer ${TEXT_LAYER} by default so it stays above the footage. A template sets the whole look; style fields given override it (default: white bold sans-serif, 72px, thin black outline). Use load_font for other Google Fonts; a stroke or a background keeps it readable on busy footage. highlight colors one word (karaoke-style captions). Check it with preview_frame.`,
  input: {
    text: z.string().min(1),
    start: z
      .number()
      .min(0)
      .optional()
      .describe(
        'Seconds on the timeline; default after the last clip on its layer',
      ),
    duration: z.number().positive().default(3),
    layer: layerField.default(TEXT_LAYER),
    box: boxField.optional(),
    template: templateField.optional(),
    ...z.object(textStyleFields).partial().shape,
    highlight: highlightField.nullable().default(null),
    ...clipTimingFields,
  },
  async plan(input, timeline, deps) {
    const {
      text,
      start,
      duration,
      layer,
      box,
      template: templateName,
      fadeIn,
      fadeOut,
      opacity,
      highlight,
      ...style
    } = input;
    const template = templateName
      ? await deps.templates.use(templateName)
      : null;
    const clip: TextClip = {
      id: nextClipId(timeline),
      kind: 'text',
      layer,
      start: start ?? layerEnd(timeline, layer),
      duration,
      fadeIn,
      fadeOut,
      opacity,
      text: template ? templateText(template, text) : text,
      box: box ?? defaultTextBox(timeline.setup),
      style: resolveTextStyle(template, style),
      highlight,
    };
    const notes = textNotes(clip);
    return {
      commands: [{ type: 'add_clip', clip }],
      text: [
        `Added text ${clip.id} from ${clip.start}s to ${clipEnd(clip)}s.`,
        ...notes,
      ].join(' '),
    };
  },
});
