import { z } from 'zod';
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
  description: `Shows text (a title, a caption) for \`duration\` seconds. It is laid out inside box (default: a caption area in the lower part of the frame), wrapped to its width; fit="shrink" makes long text fit. Text goes on layer ${TEXT_LAYER} by default so it stays above the footage. Use load_font for Google Fonts; a stroke or a background keeps it readable on busy footage. highlight colors one word (karaoke-style captions). Check it with preview_frame.`,
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
    font: textStyleFields.font.default('sans-serif'),
    size: textStyleFields.size.default(72),
    weight: textStyleFields.weight.default('bold'),
    color: textStyleFields.color.default('#ffffff'),
    align: textStyleFields.align.default('center'),
    verticalAlign: textStyleFields.verticalAlign.default('middle'),
    lineHeight: textStyleFields.lineHeight.default(1.15),
    letterSpacing: textStyleFields.letterSpacing.default(0),
    stroke: textStyleFields.stroke.default('#000000'),
    strokeWidth: textStyleFields.strokeWidth.default(4),
    background: textStyleFields.background.default(null),
    fit: textStyleFields.fit.default('shrink'),
    highlight: highlightField.nullable().default(null),
    ...clipTimingFields,
  },
  plan(input, timeline) {
    const {
      text,
      start,
      duration,
      layer,
      box,
      fadeIn,
      fadeOut,
      opacity,
      highlight,
      ...style
    } = input;
    const clip: TextClip = {
      id: nextClipId(timeline),
      kind: 'text',
      layer,
      start: start ?? layerEnd(timeline, layer),
      duration,
      fadeIn,
      fadeOut,
      opacity,
      text,
      box: box ?? defaultTextBox(timeline.setup),
      style,
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
