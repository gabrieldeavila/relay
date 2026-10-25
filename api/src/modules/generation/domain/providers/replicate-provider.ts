import { ASPECT_RATIO } from '../image-shape.js';
import type { GenerationConfig, ProviderSpec } from '../provider-spec.js';

interface Prediction {
  status?: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string | string[] | null;
  error?: string | null;
  urls?: { get?: string };
}

const headers = (config: GenerationConfig) => ({
  authorization: `Bearer ${config.apiKey}`,
});

/** Any Replicate model that takes prompt + aspect_ratio (e.g. FLUX); waits, then polls. */
export const replicateProvider: ProviderSpec = {
  id: 'replicate',
  label: 'Replicate',
  keyVariable: 'REPLICATE_API_TOKEN',
  defaultModel: 'black-forest-labs/flux-schnell',
  defaultBaseUrl: 'https://api.replicate.com/v1',
  canBeTransparent: false,
  call: (config, request, prompt) => ({
    method: 'POST',
    url: `${config.baseUrl}/models/${config.model}/predictions`,
    headers: { ...headers(config), prefer: 'wait' },
    body: {
      input: {
        prompt,
        aspect_ratio: ASPECT_RATIO[request.shape],
        output_format: 'png',
      },
    },
  }),
  readReply(json, config) {
    const prediction = json as Prediction;
    if (prediction.status === 'succeeded') {
      const output = prediction.output;
      const url = Array.isArray(output) ? output[0] : output;
      return url
        ? { kind: 'url', url }
        : { kind: 'failed', reason: 'Replicate returned no image' };
    }
    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      return {
        kind: 'failed',
        reason: prediction.error ?? `Replicate ${prediction.status}`,
      };
    }
    const poll = prediction.urls?.get;
    if (!poll)
      return {
        kind: 'failed',
        reason: 'Replicate gave no way to check the result',
      };
    return {
      kind: 'pending',
      poll: { method: 'GET', url: poll, headers: headers(config) },
    };
  },
};
