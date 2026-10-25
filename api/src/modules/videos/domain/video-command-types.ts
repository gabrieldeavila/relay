import type { Clip, VideoSetup } from './timeline-types.js';

/** Fields of a clip that update_clip may change (kind and id never change). */
export type ClipChanges = Partial<Omit<Clip, 'id' | 'kind'>> &
  Record<string, unknown>;

/** Edits to a timeline. Ids are decided before a command is stored, so replays match. */
export type VideoCommand =
  | { type: 'add_clip'; clip: Clip }
  | { type: 'update_clip'; clipId: string; changes: ClipChanges }
  | { type: 'split_clip'; clipId: string; at: number; newClipId: string }
  | { type: 'delete_clip'; clipId: string }
  | { type: 'set_setup'; changes: Partial<VideoSetup> };
