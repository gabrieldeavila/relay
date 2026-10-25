import { randomUUID } from 'node:crypto';
import { mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** A temp folder for one render's files, removed when the work is done. */
export async function withRenderFolder<T>(
  work: (fileIn: (name: string) => string) => Promise<T>,
): Promise<T> {
  const folder = join(tmpdir(), 'relay-render', randomUUID());
  await mkdir(folder, { recursive: true });
  try {
    return await work((name) => join(folder, name));
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
}
