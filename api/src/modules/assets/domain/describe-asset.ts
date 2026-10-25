import type { Asset } from './asset.js';

/** What tools and the UI show about an asset: no disk details beyond the path. */
export function describeAsset(asset: Asset, baseUrl: string) {
  return {
    id: asset.id,
    kind: asset.kind,
    name: asset.name,
    mimeType: asset.mimeType,
    bytes: asset.bytes,
    width: asset.width,
    height: asset.height,
    durationSeconds: asset.durationMs === null ? null : asset.durationMs / 1000,
    hasAudio: asset.hasAudio,
    source: asset.source,
    path: asset.path,
    url: `${baseUrl}/assets/${asset.id}/file`,
    createdAt: asset.createdAt.toISOString(),
  };
}
