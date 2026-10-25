import { clipEnd } from './clip-timing.js';
import type { Box, Timeline, VideoSetup } from './timeline-types.js';

/** Where the last clip on a layer ends, so new clips can be appended. */
export function layerEnd(timeline: Timeline, layer: number): number {
  const ends = timeline.clips
    .filter((clip) => clip.layer === layer)
    .map(clipEnd);
  return Math.max(0, ...ends);
}

/** A caption area across the lower part of the frame. */
export function defaultTextBox(setup: VideoSetup): Box {
  return {
    x: Math.round(setup.width * 0.05),
    y: Math.round(setup.height * 0.7),
    width: Math.round(setup.width * 0.9),
    height: Math.round(setup.height * 0.15),
  };
}
