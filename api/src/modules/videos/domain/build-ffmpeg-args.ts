import { audioChain, mixAudio } from './audio-filters.js';
import { clipDuration, timelineDuration } from './clip-timing.js';
import { seconds, type RenderInputs } from './render-inputs.js';
import type { Clip, MediaClip, Timeline } from './timeline-types.js';
import { overlayOptions, pictureChain } from './video-filters.js';

/** An mp4 of the whole timeline, or a PNG of its first frame (see frameTimeline). */
export type RenderTarget =
  { kind: 'video'; path: string } | { kind: 'frame'; path: string };

/** ffmpeg arguments that render a timeline. Pure: every file it needs is in `inputs`. */
export function buildFfmpegArgs(
  timeline: Timeline,
  inputs: RenderInputs,
  target: RenderTarget,
): string[] {
  const { setup } = timeline;
  // A frame may show an empty moment: then it's just the background.
  const total =
    target.kind === 'frame'
      ? Math.max(timelineDuration(timeline), 1 / setup.fps)
      : timelineDuration(timeline);
  if (total <= 0) throw new Error('The video is empty: add a clip first');
  const args = ['-hide_banner', '-y', '-loglevel', 'error'];
  args.push('-f', 'lavfi', '-i', background(timeline, total));

  const graph: string[] = [];
  let frame = '[0:v]';
  const audio: string[] = [];
  orderedClips(timeline).forEach((clip, i) => {
    const input = i + 1;
    args.push(...inputArgs(clip, inputs, setup.fps));
    if (hasPicture(clip, inputs)) {
      graph.push(`[${input}:v]${pictureChain(clip, setup).join(',')}[p${i}]`);
      graph.push(`${frame}[p${i}]${overlayOptions(clip, setup)}[o${i}]`);
      frame = `[o${i}]`;
    }
    if (target.kind === 'video' && hasSound(clip, inputs)) {
      graph.push(`[${input}:a]${audioChain(clip).join(',')}[a${i}]`);
      audio.push(`[a${i}]`);
    }
  });
  graph.push(`${frame}format=yuv420p[vout]`);
  if (audio.length > 0) graph.push(mixAudio(audio));

  args.push('-filter_complex', graph.join(';'), '-map', '[vout]');
  if (target.kind === 'frame') {
    return [...args, '-frames:v', '1', '-update', '1', target.path];
  }
  if (audio.length > 0) {
    args.push('-map', '[aout]', '-c:a', 'aac', '-b:a', '192k');
  }
  return [
    ...args,
    ...['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20'],
    ...['-pix_fmt', 'yuv420p', '-r', String(setup.fps)],
    ...['-t', seconds(total), '-movflags', '+faststart', target.path],
  ];
}

/** Bottom layer first; within a layer, earlier clips first. */
export function orderedClips(timeline: Timeline): Clip[] {
  return [...timeline.clips].sort(
    (a, b) => a.layer - b.layer || a.start - b.start,
  );
}

function background({ setup }: Timeline, total: number) {
  const color = setup.background.replace(/^#/, '0x');
  return `color=c=${color}:s=${setup.width}x${setup.height}:r=${setup.fps}:d=${seconds(total)}`;
}

function inputArgs(clip: Clip, inputs: RenderInputs, fps: number): string[] {
  const length = seconds(clipDuration(clip));
  if (clip.kind === 'media') {
    const file = mediaFile(clip.assetId, inputs);
    return ['-ss', seconds(clip.in), '-t', length, '-i', file.path];
  }
  const path =
    clip.kind === 'text'
      ? textImage(clip.id, inputs)
      : mediaFile(clip.assetId, inputs).path;
  return ['-loop', '1', '-framerate', String(fps), '-t', length, '-i', path];
}

function hasPicture(clip: Clip, inputs: RenderInputs) {
  return clip.kind !== 'media' || mediaFile(clip.assetId, inputs).hasVideo;
}

function hasSound(clip: Clip, inputs: RenderInputs): clip is MediaClip {
  return (
    clip.kind === 'media' &&
    clip.volume > 0 &&
    mediaFile(clip.assetId, inputs).hasAudio
  );
}

function mediaFile(assetId: string, inputs: RenderInputs) {
  const file = inputs.media[assetId];
  if (!file) throw new Error(`Missing file for asset ${assetId}`);
  return file;
}

function textImage(clipId: string, inputs: RenderInputs) {
  const path = inputs.textImages[clipId];
  if (!path) throw new Error(`Missing text image for ${clipId}`);
  return path;
}
