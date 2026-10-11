import type { StepStatus } from './step-status.js';

const ALLOWED: Record<StepStatus, readonly StepStatus[]> = {
  pending: ['ready', 'skipped', 'cancelled'],
  ready: ['running', 'cancelled'],
  // `ready` again: the reaper reclaimed an expired lease after a crash.
  running: ['succeeded', 'failed', 'retrying', 'waiting', 'ready', 'cancelled'],
  // Workers claim retrying steps and sleeping (delay) steps straight from the queue.
  retrying: ['running', 'cancelled'],
  waiting: ['running', 'ready', 'timed_out', 'cancelled'],
  succeeded: [],
  failed: [],
  timed_out: [],
  skipped: [],
  cancelled: [],
};

export const canTransition = (from: StepStatus, to: StepStatus) =>
  ALLOWED[from].includes(to);

export class InvalidStepTransition extends Error {
  constructor(from: StepStatus, to: StepStatus) {
    super(`Step cannot go from ${from} to ${to}`);
  }
}

export function assertTransition(from: StepStatus, to: StepStatus) {
  if (!canTransition(from, to)) throw new InvalidStepTransition(from, to);
}
