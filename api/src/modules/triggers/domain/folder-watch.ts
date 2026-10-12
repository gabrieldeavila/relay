import { z } from 'zod';

/** A folder on this machine and which file names in it start the flow. */
export const folderWatchSchema = z.object({
  folder: z
    .string()
    .trim()
    .min(1)
    .refine(
      (path) => path.startsWith('/') || path.startsWith('~'),
      'Use the full path of the folder, e.g. /Users/you/Downloads',
    ),
  /** `*.pdf`, or several: `*.jpg, *.png`. */
  pattern: z.string().trim().default('*'),
});

export type FolderWatch = z.infer<typeof folderWatchSchema>;

/** Case-insensitive `*` / `?` globs, separated by commas; empty matches all. */
export function matchesPattern(name: string, pattern: string): boolean {
  const globs = pattern
    .split(',')
    .map((glob) => glob.trim())
    .filter(Boolean);
  if (globs.length === 0) return true;
  return globs.some((glob) => globToRegExp(glob).test(name));
}

function globToRegExp(glob: string): RegExp {
  const source = glob
    .split('')
    .map((char) =>
      char === '*'
        ? '.*'
        : char === '?'
          ? '.'
          : char.replace(/[.+^${}()|[\]\\]/g, '\\$&'),
    )
    .join('');
  return new RegExp(`^${source}$`, 'i');
}
