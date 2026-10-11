/** Abort reason when an attempt runs past its node's `timeoutMs`. */
export class AttemptTimeout extends Error {
  override name = 'TimeoutError';

  constructor(timeoutMs: number) {
    super(`Gave up after ${Math.round(timeoutMs / 1000)}s without an answer`);
  }
}

/** Rejects as soon as `signal` aborts, even if the node ignores the signal. */
export function raceAbort<T>(
  work: Promise<T>,
  signal: AbortSignal,
): Promise<T> {
  if (signal.aborted) return Promise.reject(signal.reason as Error);
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(signal.reason as Error);
    signal.addEventListener('abort', onAbort, { once: true });
    work.then(resolve, reject).finally(() => {
      signal.removeEventListener('abort', onAbort);
    });
  });
}
