import type { ProviderId, ProviderSpec } from '../provider-spec.js';
import { falProvider } from './fal-provider.js';
import { geminiProvider } from './gemini-provider.js';
import { openaiProvider } from './openai-provider.js';
import { replicateProvider } from './replicate-provider.js';

export const PROVIDERS: Record<ProviderId, ProviderSpec> = {
  openai: openaiProvider,
  gemini: geminiProvider,
  replicate: replicateProvider,
  fal: falProvider,
};

export const PROVIDER_IDS = Object.keys(PROVIDERS) as ProviderId[];
