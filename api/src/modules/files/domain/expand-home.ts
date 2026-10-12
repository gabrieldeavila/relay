import { isAbsolute } from 'node:path';

/** `~/Desktop/a.csv` → `<home>/Desktop/a.csv`; other paths are left alone. */
export function expandHome(path: string, home: string): string {
  const trimmed = path.trim();
  if (trimmed === '~') return home;
  if (trimmed.startsWith('~/')) return `${home}${trimmed.slice(1)}`;
  return trimmed;
}

/** Steps read local files by full path; relative ones would depend on where the API runs. */
export const isUsablePath = (path: string) => isAbsolute(path);
