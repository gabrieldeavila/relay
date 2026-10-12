import type { StepError } from '../../engine/domain/step-error.js';

/**
 * API failures as step errors: a refused key will not start working by
 * itself; rate limits, overload (529) and server errors are worth a retry.
 * `status` is undefined when the request never got an answer.
 */
export function classifyAiError(
  status: number | undefined,
  message: string,
): StepError {
  if (status === undefined) return { kind: 'network', message };
  if (status === 401 || status === 403) {
    return {
      kind: 'invalid',
      message: `Anthropic refused the API key: ${message}`,
    };
  }
  return { kind: 'http', status, message: `Claude: ${message}` };
}
