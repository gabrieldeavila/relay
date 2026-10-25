import type { Asset } from '../domain/asset.js';
import type { AssetStore } from './asset-store.js';

/** How a tool names a media file: one that's already an asset, a local path or a URL. */
export interface MediaInput {
  assetId?: string;
  path?: string;
  url?: string;
}

/** The asset for a media input, importing local files and URLs first. */
export async function resolveMedia(
  store: Pick<AssetStore, 'get' | 'importPath' | 'importUrl'>,
  input: MediaInput,
): Promise<Asset> {
  const given = [input.assetId, input.path, input.url].filter(Boolean);
  if (given.length !== 1) {
    throw new Error('Pass exactly one of assetId, path or url');
  }
  if (input.assetId) return store.get(input.assetId);
  if (input.path) return store.importPath(input.path);
  return store.importUrl(input.url!);
}
