import type { Timeline } from './timeline-types.js';

/** Every asset the timeline uses, once. */
export function timelineAssetIds(timeline: Timeline): string[] {
  const ids = timeline.clips.flatMap((clip) =>
    'assetId' in clip ? [clip.assetId] : [],
  );
  return [...new Set(ids)];
}
