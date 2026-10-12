import { matchesPattern } from './folder-watch.js';

export interface ListedFile {
  name: string;
  bytes: number;
  /** Last change, in ms; a file written again counts as new again. */
  modifiedMs: number;
}

/** A file must sit still this long, so half-copied files are not picked up. */
export const SETTLE_MS = 2_000;

/**
 * Files that should start a run now: matching the pattern, not hidden, done
 * being written, and new or changed since they were last seen. Oldest first.
 */
export function pickNewFiles(
  listing: ListedFile[],
  seen: ReadonlyMap<string, number>,
  { pattern, now, limit }: { pattern: string; now: Date; limit: number },
): ListedFile[] {
  return listing
    .filter((file) => !file.name.startsWith('.'))
    .filter((file) => matchesPattern(file.name, pattern))
    .filter((file) => file.modifiedMs <= now.getTime() - SETTLE_MS)
    .filter((file) => seen.get(file.name) !== file.modifiedMs)
    .sort((a, b) => a.modifiedMs - b.modifiedMs)
    .slice(0, limit);
}
