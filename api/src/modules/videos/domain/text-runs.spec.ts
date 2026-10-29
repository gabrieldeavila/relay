import { groupTextRuns } from './text-runs.js';
import { image, media, text } from './test-clips.js';

describe('groupTextRuns', () => {
  const caption = (id: string, start: number, over = {}) =>
    text({ id, start, duration: 1, layer: 11, ...over });

  it('merges back-to-back text clips on a layer into one run', () => {
    const [video, run] = groupTextRuns([
      media(),
      caption('c1', 0),
      caption('c2', 1),
      caption('c3', 2.5),
    ]);
    expect(video).toEqual(media());
    expect(run).toMatchObject({
      kind: 'textRun',
      id: 'c1',
      start: 0,
      end: 3.5,
    });
    expect(run.kind === 'textRun' && run.clips.map((c) => c.id)).toEqual([
      'c1',
      'c2',
      'c3',
    ]);
  });

  it('keeps a lone text clip as it is', () => {
    expect(groupTextRuns([caption('c1', 0)])).toEqual([caption('c1', 0)]);
  });

  it('breaks runs at overlaps, other layers, other clips and faded text', () => {
    const items = groupTextRuns([
      caption('c1', 0),
      caption('c2', 0.5),
      image({ layer: 11, start: 2 }),
      caption('c3', 3, { fadeIn: 0.2 }),
      caption('c4', 4),
      caption('c5', 5, { layer: 12 }),
    ]);
    expect(items.map((item) => item.kind)).toEqual([
      'text',
      'text',
      'image',
      'text',
      'text',
      'text',
    ]);
  });
});
