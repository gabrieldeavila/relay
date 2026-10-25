import { fadeAlpha, isActiveAt, timelineDuration } from './clip-timing.js';
import type { Clip, Timeline } from './timeline-types.js';

/**
 * A one-frame timeline showing the moment `t`: only clips on screen then,
 * moved to 0 with their fades baked into opacity. Renders fast at any t.
 */
export function frameTimeline(timeline: Timeline, t: number): Timeline {
  const total = timelineDuration(timeline);
  if (total <= 0) throw new Error('The video is empty: add a clip first');
  if (t < 0 || t >= total) {
    throw new Error(`Time ${t}s is outside the video (0 to ${total}s)`);
  }
  const frame = 1 / timeline.setup.fps;
  const clips = timeline.clips
    .filter((clip) => isActiveAt(clip, t))
    .map((clip) => atMoment(clip, t, frame));
  return { ...timeline, clips };
}

function atMoment(clip: Clip, t: number, frame: number): Clip {
  const still = {
    start: 0,
    fadeIn: 0,
    fadeOut: 0,
    opacity: clip.opacity * fadeAlpha(clip, t),
  };
  if (clip.kind !== 'media') return { ...clip, ...still, duration: frame };
  const from = Math.min(clip.in + (t - clip.start), clip.out - frame);
  return {
    ...clip,
    ...still,
    in: Math.max(0, from),
    out: Math.max(0, from) + frame,
    volume: 0,
  };
}

/** `count` moments spread evenly over the video, for a contact sheet. */
export function stripTimes(timeline: Timeline, count: number): number[] {
  const total = timelineDuration(timeline);
  return Array.from({ length: count }, (_, i) =>
    Number(((total * (i + 0.5)) / count).toFixed(3)),
  );
}
