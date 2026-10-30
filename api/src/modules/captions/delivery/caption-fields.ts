import { layerField } from '../../videos/delivery/tools/video-fields.js';
import { CAPTION_LAYER } from '../domain/caption-phrases.js';

export const captionLayerField = layerField
  .default(CAPTION_LAYER)
  .describe(`Layer with the captions (auto_captions uses ${CAPTION_LAYER})`);
