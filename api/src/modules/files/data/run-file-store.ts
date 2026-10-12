import { Injectable } from '@nestjs/common';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { publicUrl } from '../../../public-url.js';
import { isSafeFileName, runFileName } from '../domain/run-file-name.js';

/** What later steps get: a link for apps and an absolute path for local tools. */
export interface StoredFile {
  url: string;
  path: string;
  mimeType: string;
  bytes: number;
}

/** Files produced by runs, on this machine under FILES_DIR (default `.data/files`). */
@Injectable()
export class RunFileStore {
  private readonly root = resolve(process.env.FILES_DIR ?? '.data/files');

  async save(
    runId: string,
    step: { nodeId: string; attempt: number },
    content: Buffer,
    mimeType: string,
  ): Promise<StoredFile> {
    const name = runFileName(step.nodeId, step.attempt, mimeType);
    const folder = join(this.root, runId);
    await mkdir(folder, { recursive: true });
    const path = join(folder, name);
    await writeFile(path, content);
    return {
      url: `${publicUrl()}/files/${runId}/${name}`,
      path,
      mimeType,
      bytes: content.length,
    };
  }

  /** Absolute path of an existing file, or null. */
  locate(runId: string, name: string): string | null {
    if (!/^[0-9a-f-]{36}$/.test(runId) || !isSafeFileName(name)) return null;
    const path = join(this.root, runId, name);
    return existsSync(path) ? path : null;
  }
}
