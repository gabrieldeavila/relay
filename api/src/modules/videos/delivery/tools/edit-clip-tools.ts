import { z } from 'zod';
import { findClip } from '../../domain/apply-video-command.js';
import { clipEnd } from '../../domain/clip-timing.js';
import { nextClipId } from '../../domain/next-clip-id.js';
import {
  boxField,
  clipIdField,
  fitField,
  highlightField,
  layerField,
  textStyleFields,
} from './video-fields.js';
import { defineVideoEdit } from './video-edit-tool.js';

const styleChanges = z
  .object(textStyleFields)
  .partial()
  .describe('Text clips: only the style fields to change');

export const editClipTools = [
  defineVideoEdit({
    name: 'update_clip',
    title: 'Change clip',
    description:
      'Moves, trims or restyles a clip: pass only what changes. start moves it on the timeline; in/out trim video/audio inside the source; duration sets how long images and text last; layer changes what is on top. Text clips also take text, style and highlight (null removes it).',
    input: {
      clipId: clipIdField,
      start: z.number().min(0).optional(),
      layer: layerField.optional(),
      in: z.number().min(0).optional(),
      out: z.number().positive().optional(),
      duration: z.number().positive().optional(),
      volume: z.number().min(0).max(4).optional(),
      fadeIn: z.number().min(0).optional(),
      fadeOut: z.number().min(0).optional(),
      opacity: z.number().min(0).max(1).optional(),
      fit: fitField.optional(),
      box: boxField.nullable().optional(),
      text: z.string().min(1).optional(),
      style: styleChanges.optional(),
      highlight: highlightField.nullable().optional(),
    },
    plan({ clipId, ...changes }, timeline) {
      const clip = findClip(timeline, clipId);
      const given = Object.fromEntries(
        Object.entries(changes).filter(([, value]) => value !== undefined),
      );
      const misplaced = Object.keys(given).filter(
        (key) =>
          !(key in clip) && !(key === 'highlight' && clip.kind === 'text'),
      );
      if (misplaced.length > 0) {
        throw new Error(`A ${clip.kind} clip has no ${misplaced.join(', ')}`);
      }
      return {
        commands: [{ type: 'update_clip', clipId, changes: given }],
        text: `Updated ${clipId}: ${Object.keys(given).join(', ') || 'nothing'}`,
      };
    },
  }),

  defineVideoEdit({
    name: 'split_clip',
    title: 'Split clip',
    description:
      'Cuts a clip in two at a timeline second (e.g. to remove a middle part: split twice, then delete_clip the piece). The second part gets a new id.',
    input: {
      clipId: clipIdField,
      at: z.number().positive().describe('Seconds on the timeline'),
    },
    plan({ clipId, at }, timeline) {
      const newClipId = nextClipId(timeline);
      return {
        commands: [{ type: 'split_clip', clipId, at, newClipId }],
        text: `Split ${clipId} at ${at}s; the part after it is ${newClipId}.`,
      };
    },
  }),

  defineVideoEdit({
    name: 'delete_clip',
    title: 'Delete clip',
    description: 'Removes a clip from the timeline (the asset stays).',
    input: {
      clipId: clipIdField,
      closeGap: z
        .boolean()
        .default(false)
        .describe('Move later clips on the same layer back to fill the hole'),
    },
    plan({ clipId, closeGap }, timeline) {
      const clip = findClip(timeline, clipId);
      const gap = clipEnd(clip) - clip.start;
      const later = closeGap
        ? timeline.clips.filter(
            (other) =>
              other.layer === clip.layer && other.start >= clipEnd(clip),
          )
        : [];
      return {
        commands: [
          { type: 'delete_clip', clipId },
          ...later.map((other) => ({
            type: 'update_clip' as const,
            clipId: other.id,
            changes: { start: Number((other.start - gap).toFixed(3)) },
          })),
        ],
        text: `Deleted ${clipId}${later.length ? `; moved ${later.length} later clip(s) back ${gap}s` : ''}.`,
      };
    },
  }),

  defineVideoEdit({
    name: 'update_video',
    title: 'Video settings',
    description:
      'Changes the frame size (even numbers, e.g. 1080x1920 vertical, 1920x1080 landscape, 1080x1080 square), the frame rate or the background color.',
    input: {
      width: z.number().int().optional(),
      height: z.number().int().optional(),
      fps: z.number().int().optional(),
      background: z.string().optional(),
    },
    plan(changes) {
      const given = Object.fromEntries(
        Object.entries(changes).filter(([, value]) => value !== undefined),
      );
      return {
        commands: [{ type: 'set_setup', changes: given }],
        text: `Video settings changed: ${JSON.stringify(given)}`,
      };
    },
  }),
];
