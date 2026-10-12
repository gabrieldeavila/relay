import { expandHome } from './expand-home.js';
import { parseCsv } from './parse-csv.js';
import { pickRow } from './pick-row.js';
import { tableRecords } from './table-records.js';

describe('parseCsv', () => {
  it('reads quoted fields with commas, quotes and line breaks', () => {
    expect(
      parseCsv(
        'quote,author\r\n"Be brief, be clear","Ana ""A"" Lima"\n"Two\nlines",Bia\n',
      ),
    ).toEqual([
      ['quote', 'author'],
      ['Be brief, be clear', 'Ana "A" Lima'],
      ['Two\nlines', 'Bia'],
    ]);
  });

  it('detects the semicolons Excel writes in many languages', () => {
    expect(parseCsv('﻿nome;valor\nCafé;3,50')).toEqual([
      ['nome', 'valor'],
      ['Café', '3,50'],
    ]);
  });

  it('detects tabs and keeps empty fields', () => {
    expect(parseCsv('a\tb\tc\n1\t\t3')).toEqual([
      ['a', 'b', 'c'],
      ['1', '', '3'],
    ]);
  });
});

describe('tableRecords', () => {
  it('names values by the header and drops blank rows', () => {
    expect(
      tableRecords(
        [
          ['', ''],
          [' quote ', 'author'],
          ['Keep going ', 'Ana'],
          ['', null],
          ['Rest', 7],
        ],
        100,
      ),
    ).toEqual({
      columns: ['quote', 'author'],
      rows: [
        { quote: 'Keep going', author: 'Ana' },
        { quote: 'Rest', author: 7 },
      ],
      truncated: false,
    });
  });

  it('names blank and repeated headers, and fills short rows', () => {
    expect(tableRecords([['a', '', 'a'], ['1']], 100)).toEqual({
      columns: ['a', 'column_2', 'a_2'],
      rows: [{ a: '1', column_2: null, a_2: null }],
      truncated: false,
    });
  });

  it('keeps at most `limit` rows and says so', () => {
    const table = tableRecords([['n'], ['1'], ['2'], ['3']], 2);
    expect(table.rows).toHaveLength(2);
    expect(table.truncated).toBe(true);
  });
});

describe('pickRow', () => {
  const rows = ['a', 'b', 'c'];
  const monday = (iso: string) => new Date(`${iso}T09:00:00Z`);

  it('picks the first, last or a random row', () => {
    const now = new Date();
    expect(pickRow(rows, 'first', now)).toBe('a');
    expect(pickRow(rows, 'last', now)).toBe('c');
    expect(pickRow(rows, 'random', now, () => 0.99)).toBe('c');
    expect(pickRow([], 'first', now)).toBeNull();
  });

  it('moves to the next row each week and starts over at the end', () => {
    const picks = ['2026-10-05', '2026-10-12', '2026-10-19', '2026-10-26'].map(
      (day) => pickRow(rows, 'weekly', monday(day)),
    );
    expect(new Set(picks.slice(0, 3)).size).toBe(3);
    expect(picks[3]).toBe(picks[0]);
  });

  it('keeps the same row all week long', () => {
    const start = pickRow(rows, 'weekly', new Date('2026-10-12T00:00:00Z'));
    const end = pickRow(rows, 'weekly', new Date('2026-10-18T23:59:00Z'));
    expect(end).toBe(start);
  });

  it('moves to the next row each day', () => {
    const today = pickRow(rows, 'daily', new Date('2026-10-12T10:00:00Z'));
    const tomorrow = pickRow(rows, 'daily', new Date('2026-10-13T10:00:00Z'));
    expect(tomorrow).not.toBe(today);
  });
});

describe('expandHome', () => {
  it('expands ~ to the home folder', () => {
    expect(expandHome(' ~/Desktop/a.csv ', '/Users/ana')).toBe(
      '/Users/ana/Desktop/a.csv',
    );
    expect(expandHome('/tmp/a.csv', '/Users/ana')).toBe('/tmp/a.csv');
  });
});
