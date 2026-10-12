export const AI_MODELS = [
  'claude-opus-5-5',
  'claude-sonnet-5-5',
  'claude-haiku-5-5',
] as const;
export type AiModel = (typeof AI_MODELS)[number];

/** Models whose refusals the API can hand to another model by itself. */
const WITH_FALLBACK = new Set<AiModel>([
  'claude-opus-5-5',
  'claude-sonnet-5-5',
]);

export const FALLBACK_BETA = 'server-side-fallback-2026-07-01';

export interface AiPrompt {
  prompt: string;
  instructions?: string;
  model: AiModel;
}

/**
 * The Messages API request for one AI step. Effort is set explicitly because
 * defaults differ between models; most steps (summaries, captions, replies)
 * do well at `medium`.
 */
export function claudeRequest({ prompt, instructions, model }: AiPrompt) {
  const fallback = WITH_FALLBACK.has(model);
  return {
    model,
    max_tokens: 16_000,
    output_config: { effort: 'medium' as const },
    ...(instructions?.trim() ? { system: instructions.trim() } : {}),
    messages: [{ role: 'user' as const, content: prompt }],
    ...(fallback
      ? { betas: [FALLBACK_BETA], fallbacks: 'default' as const }
      : {}),
  };
}
