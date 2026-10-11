import type { StepError } from './step-error.js';

export type WaitingFor = 'time' | 'event';

/** How one attempt (or a wait) ended, as written to its step row. */
export type StepChange =
  | { status: 'succeeded'; port: string; output: unknown; input?: unknown }
  | { status: 'waiting'; waitingFor: 'time'; runAt: Date; input: unknown }
  | {
      status: 'waiting';
      waitingFor: 'event';
      deadlineAt: Date | null;
      input: unknown;
    }
  | { status: 'retrying'; runAt: Date; error: StepError; input?: unknown }
  | { status: 'failed'; port?: string; error: StepError; input?: unknown }
  | { status: 'timed_out'; port?: string; error: StepError };
