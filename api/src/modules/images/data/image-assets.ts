import type { AssetStore } from '../../assets/data/asset-store.js';
import {
  resolveMedia,
  type MediaInput,
} from '../../assets/data/resolve-media.js';
import type { Asset } from '../../assets/domain/asset.js';
import { assetRef } from '../../assets/domain/asset-ref.js';

/** What image tools need from the asset store. */
export type ImageAssetStore = Pick<
  AssetStore,
  'get' | 'importPath' | 'importUrl' | 'saveBytes'
>;

/** An image to draw: its `asset:<id>` source for commands and its natural size. */
export interface ImageSource {
  asset: Asset;
  src: string;
  width: number;
  height: number;
}

/** The image for a tool's assetId/path/url, importing it as an asset when needed. */
export async function imageSourceFor(
  assets: ImageAssetStore,
  input: MediaInput,
): Promise<ImageSource> {
  const asset = await resolveMedia(assets, input);
  if (asset.kind !== 'image' || !asset.width || !asset.height) {
    throw new Error(`${asset.name} is not an image (it's ${asset.kind})`);
  }
  return {
    asset,
    src: assetRef(asset.id),
    width: asset.width,
    height: asset.height,
  };
}
