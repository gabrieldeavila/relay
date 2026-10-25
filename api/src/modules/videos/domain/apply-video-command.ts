import { assertValidClip, assertValidSetup } from './check-clip.js';
import { clipEnd } from './clip-timing.js';
import type { Clip, Timeline } from './timeline-types.js';
import type { ClipChanges, VideoCommand } from './video-command-types.js';

/** The timeline after one command. Throws (without changing anything) when it can't apply. */
export function applyVideoCommand(
  timeline: Timeline,
  command: VideoCommand,
): Timeline {
  switch (command.type) {
    case 'add_clip':
      return addClip(timeline, command.clip);
    case 'update_clip':
      return replaceClip(timeline, command.clipId, (clip) =>
        updated(clip, command.changes),
      );
    case 'split_clip':
      return splitClip(timeline, command.clipId, command.at, command.newClipId);
    case 'delete_clip':
      findClip(timeline, command.clipId);
      return {
        ...timeline,
        clips: timeline.clips.filter((clip) => clip.id !== command.clipId),
      };
    case 'set_setup': {
      const setup = { ...timeline.setup, ...command.changes };
      assertValidSetup(setup);
      return { ...timeline, setup };
    }
  }
}

export function findClip(timeline: Timeline, clipId: string): Clip {
  const clip = timeline.clips.find((c) => c.id === clipId);
  if (!clip) {
    throw new Error(`No clip ${clipId}. video_get lists the clips.`);
  }
  return clip;
}

function addClip(timeline: Timeline, clip: Clip): Timeline {
  if (timeline.clips.some((c) => c.id === clip.id)) {
    throw new Error(`Clip id ${clip.id} is taken`);
  }
  assertValidClip(clip);
  return { ...timeline, clips: [...timeline.clips, clip] };
}

function replaceClip(
  timeline: Timeline,
  clipId: string,
  change: (clip: Clip) => Clip[],
): Timeline {
  const clip = findClip(timeline, clipId);
  const next = change(clip);
  next.forEach(assertValidClip);
  const index = timeline.clips.indexOf(clip);
  const clips = [...timeline.clips];
  clips.splice(index, 1, ...next);
  return { ...timeline, clips };
}

function updated(clip: Clip, changes: ClipChanges): Clip[] {
  // A clip's id and kind never change.
  const allowed: Record<string, unknown> = { ...changes };
  delete allowed.id;
  delete allowed.kind;
  const style =
    clip.kind === 'text' && allowed.style
      ? { ...clip.style, ...allowed.style }
      : undefined;
  return [{ ...clip, ...allowed, ...(style ? { style } : {}) }];
}

/** Cuts a clip in two at timeline second `at`; the second part gets `newClipId`. */
function splitClip(
  timeline: Timeline,
  clipId: string,
  at: number,
  newClipId: string,
): Timeline {
  if (timeline.clips.some((c) => c.id === newClipId)) {
    throw new Error(`Clip id ${newClipId} is taken`);
  }
  return replaceClip(timeline, clipId, (clip) => {
    if (at <= clip.start || at >= clipEnd(clip)) {
      throw new Error(
        `Split point ${at}s is outside clip ${clip.id} (${clip.start}s to ${clipEnd(clip)}s)`,
      );
    }
    const firstLength = at - clip.start;
    const first = { ...clip, fadeOut: 0 };
    const second = { ...clip, id: newClipId, start: at, fadeIn: 0 };
    if (
      clip.kind === 'media' &&
      first.kind === 'media' &&
      second.kind === 'media'
    ) {
      first.out = clip.in + firstLength;
      second.in = clip.in + firstLength;
    } else if (first.kind !== 'media' && second.kind !== 'media') {
      first.duration = firstLength;
      second.duration = clipEnd(clip) - at;
    }
    return [first, second];
  });
}
