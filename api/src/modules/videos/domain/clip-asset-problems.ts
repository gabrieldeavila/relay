import type { Asset } from '../../assets/domain/asset.js';
import type { Clip } from './timeline-types.js';

/** Slack for durations rounded by ffprobe. */
const TOLERANCE = 0.05;

/** Whether a clip can use its asset: right kind of file, trim inside the source. */
export function clipAssetProblems(
  clip: Clip,
  asset: Asset | undefined,
): string[] {
  if (clip.kind === 'text') return [];
  if (!asset) return [`asset ${clip.assetId} does not exist`];
  if (clip.kind === 'image') {
    return asset.kind === 'image'
      ? []
      : [`${asset.name} is a ${asset.kind}; use it as a media clip`];
  }
  if (asset.kind === 'image') {
    return [
      `${asset.name} is an image; add it with a duration instead of in/out`,
    ];
  }
  const length = (asset.durationMs ?? 0) / 1000;
  return clip.out > length + TOLERANCE
    ? [`out (${clip.out}s) is past the end of ${asset.name} (${length}s)`]
    : [];
}
