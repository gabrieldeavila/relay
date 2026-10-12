import { folderWatchSchema, matchesPattern } from './folder-watch.js';
import { pickNewFiles, SETTLE_MS } from './pick-new-files.js';

describe('matchesPattern', () => {
  it.each([
    ['report.PDF', '*.pdf', true],
    ['photo.jpg', '*.png, *.jpg', true],
    ['photo.jpeg', '*.jpg', false],
    ['scan-01.png', 'scan-??.png', true],
    ['a+b (1).txt', 'a+b (1).txt', true],
    ['anything', '', true],
    ['anything', '*', true],
  ])('%s against %j → %s', (name, pattern, expected) => {
    expect(matchesPattern(name, pattern)).toBe(expected);
  });
});

describe('folderWatchSchema', () => {
  it('needs a full path (or one from the home folder)', () => {
    expect(folderWatchSchema.safeParse({ folder: '~/Inbox' }).success).toBe(
      true,
    );
    expect(folderWatchSchema.safeParse({ folder: 'Inbox' }).success).toBe(
      false,
    );
    expect(folderWatchSchema.parse({ folder: '/tmp/in' }).pattern).toBe('*');
  });
});

describe('pickNewFiles', () => {
  const now = new Date('2026-10-12T12:00:00Z');
  const ago = (ms: number) => now.getTime() - ms;
  const file = (name: string, modifiedMs = ago(60_000)) => ({
    name,
    bytes: 10,
    modifiedMs,
  });
  const pick = (
    listing: ReturnType<typeof file>[],
    seen: [string, number][] = [],
    pattern = '*',
  ) =>
    pickNewFiles(listing, new Map(seen), { pattern, now, limit: 10 }).map(
      (f) => f.name,
    );

  it('picks files never seen, oldest first', () => {
    expect(pick([file('b', ago(5_000)), file('a', ago(9_000))])).toEqual([
      'a',
      'b',
    ]);
  });

  it('skips files already seen, unless they changed since', () => {
    const old = ago(60_000);
    expect(
      pick(
        [file('same', old), file('edited', old)],
        [
          ['same', old],
          ['edited', ago(90_000)],
        ],
      ),
    ).toEqual(['edited']);
  });

  it('waits until a file stops changing', () => {
    expect(pick([file('copying', ago(SETTLE_MS - 1))])).toEqual([]);
  });

  it('ignores hidden files and names outside the pattern', () => {
    expect(
      pick([file('.DS_Store'), file('a.pdf'), file('b.txt')], [], '*.pdf'),
    ).toEqual(['a.pdf']);
  });

  it('takes at most `limit` per round', () => {
    const many = Array.from({ length: 5 }, (_, i) =>
      file(`f${i}`, ago(10_000 + i)),
    );
    expect(
      pickNewFiles(many, new Map(), { pattern: '*', now, limit: 2 }),
    ).toHaveLength(2);
  });
});
