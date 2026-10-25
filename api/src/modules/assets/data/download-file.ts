import { createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

/** Saves an http(s) URL to `path` and returns its content type. */
export async function downloadFile(url: string, path: string) {
  if (!/^https?:\/\//.test(url)) {
    throw new Error('url must start with http:// or https://');
  }
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Could not download ${url}: HTTP ${response.status}`);
  }
  await pipeline(
    Readable.fromWeb(response.body as import('node:stream/web').ReadableStream),
    createWriteStream(path),
  );
  return response.headers.get('content-type') ?? '';
}
