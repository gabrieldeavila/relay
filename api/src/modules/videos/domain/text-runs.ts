import { clipEnd } from './clip-timing.js';
import type { Clip, TextClip } from './timeline-types.js';

/** Back-to-back text clips on one layer (captions), rendered as one ffmpeg input. */
export interface TextRun {
  kind: 'textRun';
  /** The first clip's id. */
  id: string;
  start: number;
  end: number;
  clips: TextClip[];
}

/** What buildFfmpegArgs overlays, in draw order. */
export type RenderItem = Clip | TextRun;

/**
 * Clips in draw order with runs of plain text clips that follow each other on
 * the same layer merged, so hundreds of captions don't open hundreds of inputs.
 * Merging keeps the look: only one clip of a run is on screen at a time.
 */
export function groupTextRuns(ordered: Clip[]): RenderItem[] {
  const items: RenderItem[] = [];
  let run: TextClip[] = [];
  const flush = () => {
    if (run.length === 1) items.push(run[0]);
    if (run.length > 1) items.push(toRun(run));
    run = [];
  };
  for (const clip of ordered) {
    if (!isPlainText(clip)) {
      flush();
      items.push(clip);
      continue;
    }
    if (!follows(run, clip)) flush();
    run.push(clip);
  }
  flush();
  return items;
}

/** Text without fades or transparency: its PNG is all there is to show. */
function isPlainText(clip: Clip): clip is TextClip {
  return (
    clip.kind === 'text' &&
    clip.opacity === 1 &&
    clip.fadeIn === 0 &&
    clip.fadeOut === 0
  );
}

function follows(run: TextClip[], clip: TextClip) {
  const last = run.at(-1);
  return !last || (last.layer === clip.layer && clip.start >= clipEnd(last));
}

function toRun(clips: TextClip[]): TextRun {
  return {
    kind: 'textRun',
    id: clips[0].id,
    start: clips[0].start,
    end: clipEnd(clips[clips.length - 1]),
    clips,
  };
}
