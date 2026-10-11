export interface NodeContext {
  /** Aborted when the attempt times out or the worker shuts down. */
  signal: AbortSignal;
  /** Same across retries of one attempt number: `runId:nodeId:attempt`. */
  idempotencyKey: string;
  attempt: number;
  /** True when the step wakes up after a `sleep` result. */
  resumed: boolean;
  now: () => Date;
}
