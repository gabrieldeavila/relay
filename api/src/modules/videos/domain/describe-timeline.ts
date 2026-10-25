import { clipEnd, timelineDuration } from './clip-timing.js';
import { orderedClips } from './build-ffmpeg-args.js';
import type { Clip, Timeline } from './timeline-types.js';

/** The timeline as an AI reads it: every clip with where it starts and ends. */
export function describeTimeline(
  timeline: Timeline,
  assetNames: Record<string, string> = {},
) {
  return {
    ...timeline.setup,
    durationSeconds: round(timelineDuration(timeline)),
    clipsByLayer: orderedClips(timeline).map((clip) =>
      describeClip(clip, assetNames),
    ),
  };
}

function describeClip(clip: Clip, assetNames: Record<string, string>) {
  const { id, kind, layer, start, ...rest } = clip;
  const asset =
    'assetId' in clip ? { assetName: assetNames[clip.assetId] ?? null } : {};
  return {
    id,
    kind,
    layer,
    start,
    end: round(clipEnd(clip)),
    ...asset,
    ...rest,
  };
}

const round = (value: number) => Math.round(value * 1000) / 1000;
