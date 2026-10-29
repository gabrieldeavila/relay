import { clipEnd } from './clip-timing.js';
import type { TextRun } from './text-runs.js';

/**
 * An ffconcat script for ffmpeg's concat demuxer: each clip's PNG for as long
 * as it's on, and `blank` (a transparent frame) in the gaps between them.
 * Times count from the run's start.
 */
export function textRunList(
  run: TextRun,
  images: Record<string, string>,
  blank: string,
): string {
  const lines = ['ffconcat version 1.0'];
  const show = (path: string, from: number, to: number) => {
    // Whole milliseconds on both ends, so hundreds of entries don't drift.
    const length = ms(to) - ms(from);
    if (length > 0)
      lines.push(`file ${quote(path)}`, `duration ${length / 1000}`);
  };
  run.clips.forEach((clip, i) => {
    const next = run.clips[i + 1];
    const end = clipEnd(clip);
    const image = imageOf(clip.id, images);
    show(
      image,
      clip.start - run.start,
      Math.min(end, next?.start ?? end) - run.start,
    );
    if (next) show(blank, end - run.start, next.start - run.start);
  });
  // The demuxer ignores the last duration unless the file is listed again.
  lines.push(
    `file ${quote(imageOf(run.clips[run.clips.length - 1].id, images))}`,
  );
  return `${lines.join('\n')}\n`;
}

const ms = (value: number) => Math.round(value * 1000);

const quote = (path: string) => `'${path.replace(/'/g, "'\\''")}'`;

function imageOf(clipId: string, images: Record<string, string>) {
  const path = images[clipId];
  if (!path) throw new Error(`Missing text image for ${clipId}`);
  return path;
}
