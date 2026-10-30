import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { TextTemplate } from '../domain/text-template.js';

/** Templates the person saved, kept in one JSON file. */
export function createTextTemplateStore(path: string) {
  let queue: Promise<unknown> = Promise.resolve();

  async function list(): Promise<TextTemplate[]> {
    try {
      return JSON.parse(await readFile(path, 'utf8')) as TextTemplate[];
    } catch {
      return [];
    }
  }

  /** One write at a time, so concurrent saves don't lose each other's changes. */
  function change(
    edit: (templates: TextTemplate[]) => TextTemplate[],
  ): Promise<void> {
    const done = queue.then(async () => {
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, JSON.stringify(edit(await list()), null, 2));
    });
    queue = done.catch(() => undefined);
    return done;
  }

  return {
    list,

    /** Adds the template, replacing a saved one with the same name. */
    save(template: TextTemplate): Promise<void> {
      return change((all) => [
        ...all.filter((t) => t.name !== template.name),
        template,
      ]);
    },

    /** True if a template with that name was removed. */
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

export type TextTemplateStore = ReturnType<typeof createTextTemplateStore>;
