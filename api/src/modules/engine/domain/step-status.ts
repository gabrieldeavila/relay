export type StepStatus =
  | 'pending'
  | 'ready'
  | 'running'
  | 'retrying'
  | 'waiting'
  | 'succeeded'
  | 'failed'
  | 'timed_out'
  | 'skipped'
  | 'cancelled';

export const TERMINAL_STATUSES: readonly StepStatus[] = [
  'succeeded',
  'failed',
  'timed_out',
  'skipped',
  'cancelled',
];

/**
 * Where a step stands for scheduling. `port` is the output the step followed
 * when it finished: `out`, `true` / `false`, or `error` / `timeout` when a
 * failure was routed to a connected port instead of failing the run.
 */
export interface StepState {
  status: StepStatus;
  port?: string;
}

/** Step state per node id; nodes without a step yet are absent. */
export type StepStates = ReadonlyMap<string, StepState>;

export const isTerminal = (status: StepStatus) =>
  TERMINAL_STATUSES.includes(status);
