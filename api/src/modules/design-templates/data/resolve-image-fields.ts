import { isUuid } from '../../../is-uuid.js';
import {
  imageSourceFor,
  type ImageAssetStore,
} from '../../images/data/image-assets.js';
import type { DesignTemplate, FieldValues } from '../domain/design-template.js';

/** Turns image fields given as an asset id, a file path or a URL into asset ids. */
export async function resolveImageFields(
  template: DesignTemplate,
  values: FieldValues,
  assets: ImageAssetStore,
): Promise<FieldValues> {
  const resolved = { ...values };
  for (const [key, field] of Object.entries(template.fields)) {
    const value = values[key];
    if (field.kind !== 'image' || !value) continue;
    const image = await imageSourceFor(assets, mediaInput(value));
    resolved[key] = image.asset.id;
  }
  return resolved;
}

function mediaInput(value: string) {
  if (isUuid(value)) return { assetId: value };
  if (/^(https?:|data:)/.test(value)) return { url: value };
  return { path: value };
}
