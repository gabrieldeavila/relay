/**
 * A failed attempt, normalized by the data layer so the domain can decide
 * whether trying again could help.
 */
export type StepError =
  | { kind: 'timeout'; message: string }
  | { kind: 'network'; message: string }
  | { kind: 'http'; status: number; message: string }
  /** Bad input or config: the same call will fail the same way. */
  | { kind: 'invalid'; message: string }
  | { kind: 'unknown'; message: string };

const RETRYABLE_HTTP = new Set([408, 425, 429]);

export function isRetryable(error: StepError): boolean {
  switch (error.kind) {
    case 'timeout':
    case 'network':
    case 'unknown':
      return true;
    case 'http':
      return error.status >= 500 || RETRYABLE_HTTP.has(error.status);
    case 'invalid':
      return false;
  }
}
