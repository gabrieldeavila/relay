import { createCanvas, loadImage, type Image } from '@napi-rs/canvas';
import { parseAssetRef } from '../../assets/domain/asset-ref.js';
import type { PaintEnv } from '../domain/paint/surface.js';

/** Paints with Skia; images are data URIs or files (no assets). Used by specs. */
export const napiPaintEnv: PaintEnv = {
  createSurface: (width, height) => createCanvas(width, height),
  loadImage: (src) => loadImage(src),
};

const CACHE_SIZE = 32;

/**
 * Like napiPaintEnv, but `asset:<id>` sources load the asset's file. Assets
 * never change, so decoded images are cached for fast replays.
 */
export function createPaintEnv(
  assetPath: (assetId: string) => Promise<string>,
): PaintEnv {
  const cache = new Map<string, Promise<Image>>();
  return {
    createSurface: (width, height) => createCanvas(width, height),
    loadImage(src) {
      const assetId = parseAssetRef(src);
      if (!assetId) return loadImage(src);
      const cached = cache.get(assetId);
      if (cached) return cached;
      const loading = assetPath(assetId).then((path) => loadImage(path));
      loading.catch(() => cache.delete(assetId));
      cache.set(assetId, loading);
      const [oldest] = cache.keys();
      if (cache.size > CACHE_SIZE) cache.delete(oldest);
      return loading;
    },
  };
}
