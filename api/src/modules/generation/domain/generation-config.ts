import type { GenerationConfig, ProviderId } from './provider-spec.js';
import { PROVIDER_IDS, PROVIDERS } from './providers/provider-catalog.js';

/**
 * Reads IMAGE_AI_PROVIDER and that provider's key; null when not set up.
 * IMAGE_AI_MODEL and IMAGE_AI_BASE_URL override the provider's defaults.
 */
export function readGenerationConfig(
  env: Record<string, string | undefined>,
): GenerationConfig | null {
  const provider = env.IMAGE_AI_PROVIDER?.trim().toLowerCase();
  if (!provider) return null;
  if (!isProvider(provider)) {
    throw new Error(
      `IMAGE_AI_PROVIDER=${provider} is not supported. Use one of ${PROVIDER_IDS.join(', ')}, or leave it empty to turn generation off.`,
    );
  }
  const spec = PROVIDERS[provider];
  const apiKey = env[spec.keyVariable]?.trim();
  if (!apiKey) {
    throw new Error(`IMAGE_AI_PROVIDER=${provider} needs ${spec.keyVariable}`);
  }
  return {
    provider,
    apiKey,
    model: env.IMAGE_AI_MODEL?.trim() || spec.defaultModel,
    baseUrl: (env.IMAGE_AI_BASE_URL?.trim() || spec.defaultBaseUrl).replace(
      /\/$/,
      '',
    ),
  };
}

const isProvider = (value: string): value is ProviderId =>
  (PROVIDER_IDS as string[]).includes(value);
