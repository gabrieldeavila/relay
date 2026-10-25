import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { copyFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { loadImage } from '@napi-rs/canvas';
import { localPath } from '../../../assets/data/local-path.js';
import type { Asset } from '../../../assets/domain/asset.js';
import {
  extensionFor,
  mediaTypeOf,
} from '../../../assets/domain/media-types.js';
import { createFontStore } from '../../data/font-store.js';
import type { ImageAssetStore } from '../../data/image-assets.js';
import { createPaintEnv } from '../../data/napi-paint-env.js';

const dir = join(tmpdir(), `relay-test-${process.pid}`);
mkdirSync(join(dir, 'assets'), { recursive: true });

/** Assets in memory and a temp folder: AssetStore's contract without a database or ffprobe. */
function createTestAssets(): ImageAssetStore {
  const saved: Asset[] = [];

  async function add(
    path: string,
    name: string,
    mimeType: string,
    source: Asset['source'],
  ) {
    const image = await loadImage(path).catch(() => null);
    const asset: Asset = {
      id: randomUUID(),
      kind: mimeType.startsWith('image/') ? 'image' : 'video',
      name,
      mimeType,
      bytes: 0,
      width: image?.width ?? null,
      height: image?.height ?? null,
      durationMs: null,
      hasAudio: false,
      source,
      path,
      createdAt: new Date(),
    };
    saved.push(asset);
    return asset;
  }

  async function saveBytes(
    bytes: Buffer,
    mimeType: string,
    name: string,
    source: Asset['source'],
  ) {
    const target = join(
      dir,
      'assets',
      `${randomUUID()}.${extensionFor(mimeType)}`,
    );
    await writeFile(target, bytes);
    return add(target, name, mimeType, source);
  }

  return {
    get(id) {
      const asset = saved.find((a) => a.id === id);
      return asset
        ? Promise.resolve(asset)
        : Promise.reject(new Error(`No asset with id ${id}. Use list_assets.`));
    },
    async importPath(path) {
      const type = mediaTypeOf(path);
      if (!type) throw new Error(`Unsupported file type: ${path}`);
      const target = join(dir, 'assets', `${randomUUID()}-${basename(path)}`);
      await copyFile(localPath(path), target).catch(() => {
        throw new Error(`File not found: ${localPath(path)}`);
      });
      return add(target, basename(path), type.mimeType, 'import');
    },
    importUrl(url) {
      const [, mimeType, base64] =
        /^data:([\w/+.-]+);base64,(.*)$/s.exec(url) ?? [];
      if (!mimeType)
        return Promise.reject(new Error('Only data: URIs in tests'));
      return saveBytes(
        Buffer.from(base64, 'base64'),
        mimeType,
        'pasted',
        'import',
      );
    },
    saveBytes,
  };
}

/** Fonts and assets for specs, kept out of the real .data folder. */
export const testServices = {
  fonts: createFontStore(join(dir, 'fonts')),
  assets: createTestAssets(),
};

/** Paints like the app: `asset:<id>` images load from testServices.assets. */
export const testPaintEnv = createPaintEnv(
  async (id) => (await testServices.assets.get(id)).path,
);
