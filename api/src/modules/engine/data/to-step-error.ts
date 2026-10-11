import { z } from 'zod';
import { StepFailure } from '../../nodes/domain/step-failure.js';
import { ExpressionError } from '../domain/expressions/expression-error.js';
import type { StepError } from '../domain/step-error.js';

/** Turns whatever an attempt threw into a StepError the domain can judge. */
export function toStepError(error: unknown): StepError {
  if (error instanceof StepFailure) return error.error;
  if (error instanceof ExpressionError) {
    return { kind: 'invalid', message: error.message };
  }
  if (error instanceof z.ZodError) {
    return { kind: 'invalid', message: z.prettifyError(error) };
  }
  const message = error instanceof Error ? error.message : String(error);
  if (isTimeout(error)) return { kind: 'timeout', message };
  if (isNetwork(error))
    return { kind: 'network', message: networkMessage(error) };
  return { kind: 'unknown', message };
}

function isTimeout(error: unknown) {
  return (
    error instanceof Error &&
    (error.name === 'TimeoutError' || error.name === 'AbortError')
  );
}

/** fetch() rejects with a TypeError("fetch failed") whose cause has the reason. */
function isNetwork(error: unknown): error is TypeError {
  return error instanceof TypeError && error.message === 'fetch failed';
}

function networkMessage(error: TypeError) {
  const cause = error.cause;
  return cause instanceof Error ? cause.message : error.message;
}
