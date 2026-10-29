import { textRunList } from './text-run-list.js';
import type { TextRun } from './text-runs.js';
import { text } from './test-clips.js';

describe('textRunList', () => {
  const run = (...clips: ReturnType<typeof text>[]): TextRun => ({
    kind: 'textRun',
    id: clips[0].id,
    start: clips[0].start,
    end: clips[clips.length - 1].start + clips[clips.length - 1].duration,
    clips,
  });
  const images = { a: '/a.png', b: "/it's b.png" };

  it('lists each image for its time, with blanks in the gaps, from the run start', () => {
    const list = textRunList(
      run(
        text({ id: 'a', start: 10.1, duration: 0.4 }),
        text({ id: 'b', start: 10.7, duration: 0.3333 }),
      ),
      images,
      '/blank.png',
    );
    expect(list).toBe(
      [
        'ffconcat version 1.0',
        "file '/a.png'",
        'duration 0.4',
        "file '/blank.png'",
        'duration 0.2',
        "file '/it'\\''s b.png'",
        'duration 0.333',
        "file '/it'\\''s b.png'",
        '',
      ].join('\n'),
    );
  });

  it('rounds on the timeline so long runs do not drift', () => {
    const clips = Array.from({ length: 300 }, (_, i) =>
      text({ id: 'a', start: i * 0.3333, duration: 0.3333 }),
    );
    const durations = textRunList(run(...clips), images, '/blank.png')
      .split('\n')
      .filter((line) => line.startsWith('duration'))
      .map((line) => Number(line.split(' ')[1]));
    const total = durations.reduce((sum, d) => sum + d, 0);
    expect(total).toBeCloseTo(300 * 0.3333, 3);
  });
});
