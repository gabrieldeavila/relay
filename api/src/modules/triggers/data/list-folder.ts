import { readdir, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { expandHome } from '../../files/domain/expand-home.js';
import type { ListedFile } from '../domain/pick-new-files.js';

/** Full path of a watched folder (`~` means the home folder). */
export const folderPath = (folder: string) => expandHome(folder, homedir());

/** Plain files directly in the folder (not in subfolders); null if it is missing. */
export async function listFolder(folder: string): Promise<ListedFile[] | null> {
  const entries = await readdir(folder, { withFileTypes: true }).catch(
    () => null,
  );
  if (!entries) return null;
  const files = await Promise.all(
    entries
      .filter((entry) => entry.isFile())
      .map(async (entry) => {
        const info = await stat(join(folder, entry.name)).catch(() => null);
        return info
          ? {
              name: entry.name,
              bytes: info.size,
              modifiedMs: Math.floor(info.mtimeMs),
            }
          : null;
      }),
  );
  return files.filter((file): file is ListedFile => file !== null);
}
