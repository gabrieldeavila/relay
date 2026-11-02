import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

/** Named items the person saved (templates), kept in one JSON file. */
export function createNamedJsonStore<T extends { name: string }>(path: string) {
  let queue: Promise<unknown> = Promise.resolve();

  async function list(): Promise<T[]> {
    try {
      return JSON.parse(await readFile(path, 'utf8')) as T[];
    } catch {
      return [];
    }
  }

  /** One write at a time, so concurrent saves don't lose each other's changes. */
  function change(edit: (items: T[]) => T[]): Promise<void> {
    const done = queue.then(async () => {
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, JSON.stringify(edit(await list()), null, 2));
    });
    queue = done.catch(() => undefined);
    return done;
  }

  return {
    list,

    /** Adds the item, replacing a saved one with the same name. */
    save(item: T): Promise<void> {
      return change((all) => [
        ...all.filter((t) => t.name !== item.name),
        item,
      ]);
    },

    /** True if an item with that name was removed. */
    async remove(name: string): Promise<boolean> {
      let found = false;
      await change((all) => {
        found = all.some((t) => t.name === name);
        return all.filter((t) => t.name !== name);
      });
      return found;
    },
  };
}

export interface NamedJsonStore<T extends { name: string }> {
  list(): Promise<T[]>;
  save(item: T): Promise<void>;
  remove(name: string): Promise<boolean>;
}
