import { emptyHistory, pushEntry, undo } from '../../history/domain/history.js';
import { applyVideoCommand } from './apply-video-command.js';
import { nextClipId } from './next-clip-id.js';
import { replayTimeline, timelineOf } from './replay-timeline.js';
import { image, media, SETUP, text, timeline } from './test-clips.js';
import type { ImageClip, TextClip } from './timeline-types.js';

describe('video commands', () => {
  it('adds, updates and deletes clips', () => {
    let t = applyVideoCommand(timeline(), { type: 'add_clip', clip: media() });
    t = applyVideoCommand(t, {
      type: 'update_clip',
      clipId: 'clip_1',
      changes: { start: 3, volume: 0.5 },
    });
    expect(t.clips[0]).toMatchObject({ start: 3, volume: 0.5, in: 2 });
    t = applyVideoCommand(t, { type: 'delete_clip', clipId: 'clip_1' });
    expect(t.clips).toEqual([]);
  });

  it('merges text style changes instead of replacing the style', () => {
    const t = applyVideoCommand(timeline(text()), {
      type: 'update_clip',
      clipId: 'clip_3',
      changes: { style: { color: '#ff0000' } },
    });
    expect((t.clips[0] as TextClip).style).toMatchObject({
      color: '#ff0000',
      size: 80,
    });
  });

  it('rejects invalid clips with messages the AI can act on', () => {
    expect(() =>
      applyVideoCommand(timeline(), {
        type: 'add_clip',
        clip: media({ out: 1 }),
      }),
    ).toThrow('Clip clip_1: out must be after in');
    expect(() =>
      applyVideoCommand(timeline(media()), {
        type: 'update_clip',
        clipId: 'clip_9',
        changes: {},
      }),
    ).toThrow('No clip clip_9');
    expect(() =>
      applyVideoCommand(timeline(), {
        type: 'set_setup',
        changes: { width: 1081 },
      }),
    ).toThrow('even');
  });

  it('splits media and stills at a timeline second', () => {
    const t = applyVideoCommand(
      timeline(media({ start: 10, fadeIn: 1, fadeOut: 1 })),
      {
        type: 'split_clip',
        clipId: 'clip_1',
        at: 12,
        newClipId: 'clip_2',
      },
    );
    expect(t.clips).toEqual([
      expect.objectContaining({
        id: 'clip_1',
        start: 10,
        in: 2,
        out: 4,
        fadeIn: 1,
        fadeOut: 0,
      }),
      expect.objectContaining({
        id: 'clip_2',
        start: 12,
        in: 4,
        out: 7,
        fadeIn: 0,
        fadeOut: 1,
      }),
    ]);
    const still = applyVideoCommand(timeline(image()), {
      type: 'split_clip',
      clipId: 'clip_2',
      at: 2,
      newClipId: 'clip_5',
    });
    expect(
      still.clips.map((c) => [c.start, (c as ImageClip).duration]),
    ).toEqual([
      [1, 1],
      [2, 2],
    ]);
    expect(() =>
      applyVideoCommand(timeline(media()), {
        type: 'split_clip',
        clipId: 'clip_1',
        at: 9,
        newClipId: 'clip_2',
      }),
    ).toThrow('outside clip');
  });

  it('replays history up to the cursor', () => {
    let history = emptyHistory<{
      label: string;
      commands: never[];
      at: string;
    }>();
    const add = { type: 'add_clip', clip: media() } as const;
    const move = {
      type: 'update_clip',
      clipId: 'clip_1',
      changes: { start: 4 },
    } as const;
    history = pushEntry(history, {
      label: 'add',
      commands: [add as never],
      at: '',
    });
    history = pushEntry(history, {
      label: 'move',
      commands: [move as never],
      at: '',
    });
    expect(timelineOf(SETUP, history).clips[0].start).toBe(4);
    expect(timelineOf(SETUP, undo(history)).clips[0].start).toBe(0);
    expect(replayTimeline(SETUP, [add]).clips).toHaveLength(1);
  });

  it('gives short predictable clip ids', () => {
    expect(nextClipId(timeline())).toBe('clip_1');
    expect(nextClipId(timeline(media({ id: 'clip_7' })), ['clip_8'])).toBe(
      'clip_9',
    );
  });
});
