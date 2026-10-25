import { isUuid } from '../../../is-uuid.js';

const PREFIX = 'asset:';

/** How documents point at an asset (e.g. an image's `place_image.src`), instead of inlining bytes. */
export const assetRef = (assetId: string) => `${PREFIX}${assetId}`;

/** The asset id in `asset:<id>`, or null for any other source. */
export function parseAssetRef(src: string): string | null {
  if (!src.startsWith(PREFIX)) return null;
  const id = src.slice(PREFIX.length);
  return isUuid(id) ? id : null;
}
