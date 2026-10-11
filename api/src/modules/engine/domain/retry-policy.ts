export interface RetryPolicy {
  /** Total attempts including the first one; 1 means never retry. */
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  multiplier: number;
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  initialDelayMs: 1_000,
  maxDelayMs: 5 * 60_000,
  multiplier: 2,
};
