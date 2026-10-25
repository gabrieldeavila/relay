import type { GenerateRequest } from './generate-request.js';

export type ProviderId = 'openai' | 'gemini' | 'replicate' | 'fal';

/** How to reach the image AI. Generation is off when Relay has none. */
export interface GenerationConfig {
  provider: ProviderId;
  apiKey: string;
  model: string;
  baseUrl: string;
}

/** An HTTP call to make (always JSON). */
export interface ProviderCall {
  method: 'GET' | 'POST';
  url: string;
  headers: Record<string, string>;
  body?: unknown;
}

/** What a provider answered: the picture itself, a link to it, or "not done yet". */
export type ProviderReply =
  | { kind: 'image'; base64: string }
  | { kind: 'url'; url: string }
  | { kind: 'pending'; poll: ProviderCall }
  | { kind: 'failed'; reason: string };

/** One image AI service: pure functions from a request to calls, and from answers to images. */
export interface ProviderSpec {
  id: ProviderId;
  label: string;
  /** Environment variable holding the key. */
  keyVariable: string;
  defaultModel: string;
  defaultBaseUrl: string;
  /** Can return a PNG with a transparent background. */
  canBeTransparent: boolean;
  call(
    config: GenerationConfig,
    request: GenerateRequest,
    prompt: string,
  ): ProviderCall;
  readReply(json: unknown, config: GenerationConfig): ProviderReply;
}
