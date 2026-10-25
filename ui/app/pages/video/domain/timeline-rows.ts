import type { TimelineClip } from "./types";

export type PlacedClip = TimelineClip & {
  leftPercent: number;
  widthPercent: number;
};

export type TimelineRow = { layer: number; clips: PlacedClip[] };

/** One row per layer, top layer first, each clip placed as a % of the video. */
export function timelineRows(
  clips: TimelineClip[],
  duration: number,
): TimelineRow[] {
  const layers = [...new Set(clips.map((clip) => clip.layer))].sort(
    (a, b) => b - a,
  );
  return layers.map((layer) => ({
    layer,
    clips: clips
      .filter((clip) => clip.layer === layer)
      .map((clip) => place(clip, duration)),
  }));
}

function place(clip: TimelineClip, duration: number): PlacedClip {
  const scale = duration > 0 ? 100 / duration : 0;
  return {
    ...clip,
    leftPercent: clip.start * scale,
    widthPercent: (clip.end - clip.start) * scale,
  };
}

/** What a clip bar says: its text, or the file it shows. */
export function clipLabel(clip: TimelineClip): string {
  if (clip.kind === "text") return `“${clip.text ?? ""}”`;
  return clip.assetName ?? clip.id;
}

/** The second under a click at `fraction` (0..1) of the timeline width. */
export function timeAt(fraction: number, duration: number): number {
  const clamped = Math.min(Math.max(fraction, 0), 0.999);
  return Math.round(clamped * duration * 100) / 100;
}
