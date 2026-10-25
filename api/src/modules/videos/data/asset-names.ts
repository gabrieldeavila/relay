import type { AssetStore } from '../../assets/data/asset-store.js';
import { timelineAssetIds } from '../domain/timeline-asset-ids.js';
import type { Timeline } from '../domain/timeline-types.js';

/** File names of the timeline's assets by id, for describing clips. */
export async function assetNamesOf(
  assets: Pick<AssetStore, 'findMany'>,
  timeline: Timeline,
): Promise<Record<string, string>> {
  const found = await assets.findMany(timelineAssetIds(timeline));
  return Object.fromEntries(found.map((asset) => [asset.id, asset.name]));
}
