export const ROW_PICKS = [
  'first',
  'last',
  'random',
  'weekly',
  'daily',
] as const;
export type RowPick = (typeof ROW_PICKS)[number];

const DAY_MS = 86_400_000;
/** 1970-01-05 was a Monday, so weeks turn over on Mondays (UTC). */
const FIRST_MONDAY_MS = 4 * DAY_MS;

/**
 * Which row a step hands on. `weekly` and `daily` walk through the list one
 * row per week (or day) and start over at the end, so a list of quotes lasts
 * as many weeks as it has rows, without remembering what was used.
 */
export function pickRow<T>(
  rows: T[],
  pick: RowPick,
  now: Date,
  random: () => number = Math.random,
): T | null {
  if (rows.length === 0) return null;
  return rows[pickIndex(rows.length, pick, now, random)];
}

function pickIndex(
  count: number,
  pick: RowPick,
  now: Date,
  random: () => number,
): number {
  switch (pick) {
    case 'first':
      return 0;
    case 'last':
      return count - 1;
    case 'random':
      return Math.floor(random() * count);
    case 'weekly':
      return (
        Math.floor((now.getTime() - FIRST_MONDAY_MS) / (7 * DAY_MS)) % count
      );
    case 'daily':
      return Math.floor(now.getTime() / DAY_MS) % count;
  }
}
