import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createCanvas } from '@napi-rs/canvas';
import { localPath } from '../../assets/data/local-path.js';
import type { DocState } from '../domain/commands/doc-state.js';
import type { ExportFormat } from '../domain/document/export-format.js';
import { compositeOf } from './document-renderer.js';

export interface EncodeOptions {
  format: ExportFormat;
  /** 0..100, for JPEG and WebP. */
  quality: number;
  /** Fills transparent areas when the format has no alpha (JPEG). */
  background: string;
}

export const MIME_BY_FORMAT: Record<ExportFormat, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

/** The full-resolution composite as PNG, JPEG or WebP bytes. */
export function encodeImage(state: DocState, options: EncodeOptions): Buffer {
  const composite = compositeOf(state);
  if (options.format === 'png') return composite.toBuffer('image/png');
  if (options.format === 'webp') {
    return composite.toBuffer('image/webp', options.quality);
  }
  // JPEG has no alpha: flatten onto the background first.
  const flat = createCanvas(composite.width, composite.height);
  const ctx = flat.getContext('2d');
  ctx.fillStyle = options.background;
  ctx.fillRect(0, 0, flat.width, flat.height);
  ctx.drawImage(composite, 0, 0);
  return flat.toBuffer('image/jpeg', options.quality);
}

/** Also saves a copy where the user asked (`~` allowed); returns the full path. */
export async function writeCopy(
  path: string,
  bytes: Buffer,
  overwrite: boolean,
): Promise<string> {
  const fullPath = localPath(path);
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, bytes, { flag: overwrite ? 'w' : 'wx' }).catch(
    (error: NodeJS.ErrnoException) => {
      if (error.code === 'EEXIST') {
        throw new Error(
          `${fullPath} already exists. Pass overwrite: true to replace it.`,
        );
      }
      throw error;
    },
  );
  return fullPath;
}
