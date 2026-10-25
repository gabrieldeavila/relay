import { z } from 'zod';
import { resolveMedia } from '../../../assets/data/resolve-media.js';
import type { Asset } from '../../../assets/domain/asset.js';
import { clipAssetProblems } from '../../domain/clip-asset-problems.js';
import { layerEnd } from '../../domain/clip-placement.js';
import { clipEnd } from '../../domain/clip-timing.js';
import { nextClipId } from '../../domain/next-clip-id.js';
import type { Box, Clip, Fit } from '../../domain/timeline-types.js';
import {
  boxField,
  clipTimingFields,
  fitField,
  layerField,
} from './video-fields.js';
import { defineVideoEdit } from './video-edit-tool.js';

const DEFAULT_IMAGE_SECONDS = 3;

export const addClipTool = defineVideoEdit({
  name: 'add_clip',
  title: 'Add clip',
  description:
    'Puts a video, audio or image file on the timeline. Give an asset (list_assets, or exported from an image with export_image), a local path or a URL (files become assets). Video/audio: trim with in/out (seconds of the source; default the whole file). Images: shown for `duration` seconds. Without start, the clip goes right after the last clip on its layer. Without box it fills the frame (fit cover crops, contain letterboxes); a box makes picture-in-picture or places a logo.',
  input: {
    assetId: z.string().optional(),
    path: z
      .string()
      .optional()
      .describe('Local file, e.g. "~/Movies/beach.mov"'),
    url: z.string().optional(),
    layer: layerField.default(0),
    start: z.number().min(0).optional().describe('Seconds on the timeline'),
    in: z
      .number()
      .min(0)
      .optional()
      .describe('Video/audio: start inside the source, seconds'),
    out: z
      .number()
      .positive()
      .optional()
      .describe('Video/audio: end inside the source, seconds'),
    duration: z
      .number()
      .positive()
      .optional()
      .describe(`Images: seconds on screen (default ${DEFAULT_IMAGE_SECONDS})`),
    volume: z
      .number()
      .min(0)
      .max(4)
      .default(1)
      .describe('1 = as recorded, 0 = mute'),
    fit: fitField.default('cover'),
    box: boxField.nullable().default(null),
    ...clipTimingFields,
  },
  async plan(input, timeline, { assets }) {
    const { assetId, path, url, ...placement } = input;
    const asset = await resolveMedia(assets, { assetId, path, url });
    const clip = clipFor(asset, placement, {
      id: nextClipId(timeline),
      start: placement.start ?? layerEnd(timeline, placement.layer),
    });
    const problems = clipAssetProblems(clip, asset);
    if (problems.length > 0) throw new Error(problems.join('; '));
    return {
      commands: [{ type: 'add_clip', clip }],
      text: `Added ${clip.id} (${asset.name}) on layer ${clip.layer} from ${clip.start}s to ${clipEnd(clip)}s.`,
    };
  },
});

/** How a new clip sits on the timeline, as the tool received it. */
interface ClipPlacement {
  layer: number;
  in?: number;
  out?: number;
  duration?: number;
  volume: number;
  fit: Fit;
  box: Box | null;
  fadeIn: number;
  fadeOut: number;
  opacity: number;
}

function clipFor(
  asset: Asset,
  p: ClipPlacement,
  at: { id: string; start: number },
): Clip {
  const common = {
    id: at.id,
    layer: p.layer,
    start: at.start,
    fadeIn: p.fadeIn,
    fadeOut: p.fadeOut,
    opacity: p.opacity,
    assetId: asset.id,
    fit: p.fit,
    box: p.box,
  };
  if (asset.kind === 'image') {
    return {
      ...common,
      kind: 'image',
      duration: p.duration ?? DEFAULT_IMAGE_SECONDS,
    };
  }
  return {
    ...common,
    kind: 'media',
    in: p.in ?? 0,
    out: p.out ?? (asset.durationMs ?? 0) / 1000,
    volume: p.volume,
  };
}
