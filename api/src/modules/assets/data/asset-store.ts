import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { copyFile, mkdir, rename, stat, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { isUuid } from '../../../is-uuid.js';
import type { Asset, AssetSource } from '../domain/asset.js';
import {
  extensionFor,
  extensionOf,
  mediaTypeOf,
  SUPPORTED_EXTENSIONS,
} from '../domain/media-types.js';
import { AssetRepository } from './asset.repository.js';
import { downloadFile } from './download-file.js';
import { localPath } from './local-path.js';
import { probeMedia } from './probe-media.js';

/** Where a new file will live before it's registered as an asset. */
export interface ReservedFile {
  id: string;
  path: string;
}

/** Media files on this machine under ASSETS_DIR (default `.data/assets`). */
@Injectable()
export class AssetStore {
  private readonly root = resolve(process.env.ASSETS_DIR ?? '.data/assets');

  constructor(private readonly repository: AssetRepository) {}

  /** Copies a local file (`~` allowed) into Relay. */
  async importPath(path: string): Promise<Asset> {
    const source = localPath(path);
    const type = mediaTypeOf(source);
    if (!type) throw unsupported(source);
    await stat(source).catch(() => {
      throw new Error(`File not found: ${source}`);
    });
    const file = await this.reserve(extensionOf(source));
    await copyFile(source, file.path);
    return this.register(file, basename(source), 'import');
  }

  /** Downloads an http(s) URL (or decodes a data: URI) into Relay. */
  async importUrl(url: string): Promise<Asset> {
    if (url.startsWith('data:')) return this.importDataUri(url);
    const temp = await this.reserve('download');
    const contentType = await downloadFile(url, temp.path);
    const extension =
      extensionFor(contentType) ?? extensionOf(new URL(url).pathname);
    if (!mediaTypeOf(`x.${extension}`)) throw unsupported(url);
    const file = { id: temp.id, path: `${temp.path}.${extension}` };
    await rename(temp.path, file.path);
    const name = basename(new URL(url).pathname) || `download.${extension}`;
    return this.register(file, name, 'import');
  }

  private importDataUri(uri: string): Promise<Asset> {
    const match = /^data:([\w/+.-]+);base64,(.*)$/s.exec(uri);
    if (!match) throw new Error('data: URIs must be base64 encoded');
    const [, mimeType, base64] = match;
    const extension = extensionFor(mimeType) ?? 'bin';
    return this.saveBytes(
      Buffer.from(base64, 'base64'),
      mimeType,
      `pasted.${extension}`,
      'import',
    );
  }

  /** Bytes made in Relay (an exported image) or a data URI's content. */
  async saveBytes(
    bytes: Buffer,
    mimeType: string,
    name: string,
    source: AssetSource,
  ): Promise<Asset> {
    const extension = extensionFor(mimeType);
    if (!extension) throw new Error(`Unsupported content type: ${mimeType}`);
    const file = await this.reserve(extension);
    await writeFile(file.path, bytes);
    return this.register(file, name, source);
  }

  /** A fresh path for a tool (ffmpeg) to write to; then call register(). */
  async reserve(extension: string): Promise<ReservedFile> {
    await mkdir(this.root, { recursive: true });
    const id = randomUUID();
    return { id, path: join(this.root, `${id}.${extension}`) };
  }

  async register(
    file: ReservedFile,
    name: string,
    source: AssetSource,
  ): Promise<Asset> {
    const type = mediaTypeOf(file.path);
    if (!type) throw unsupported(file.path);
    const info = await probeMedia(file.path, type.kind === 'image');
    const kind = type.kind === 'video' && !info.hasVideo ? 'audio' : type.kind;
    return this.repository.insert({
      id: file.id,
      kind,
      name,
      mimeType: type.mimeType,
      bytes: (await stat(file.path)).size,
      width: info.width,
      height: info.height,
      durationMs: info.durationMs,
      hasAudio: info.hasAudio,
      source,
      path: file.path,
    });
  }

  async get(id: string): Promise<Asset> {
    const asset = isUuid(id) ? await this.repository.find(id) : null;
    if (!asset) throw new Error(`No asset with id ${id}. Use list_assets.`);
    return asset;
  }

  findMany(ids: string[]) {
    return this.repository.findMany(ids);
  }

  list(kind?: Asset['kind'], limit?: number) {
    return this.repository.list(kind, limit);
  }
}

const unsupported = (name: string) =>
  new Error(
    `Unsupported file type: ${name}. Relay takes ${SUPPORTED_EXTENSIONS.join(', ')}.`,
  );
