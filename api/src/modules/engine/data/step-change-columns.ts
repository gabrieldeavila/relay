import type { StepChange } from '../domain/step-change.js';

/** Columns of a step row written for each way an attempt or wait can end. */
export function stepChangeColumns(change: StepChange) {
  const waiting = { waitingFor: null, deadlineAt: null };
  switch (change.status) {
    case 'succeeded':
      return {
        ...waiting,
        status: change.status,
        port: change.port,
        output: change.output,
        error: null,
        ...(change.input === undefined ? {} : { input: change.input }),
      };
    case 'waiting':
      return change.waitingFor === 'time'
        ? {
            status: change.status,
            waitingFor: change.waitingFor,
            runAt: change.runAt,
            deadlineAt: null,
            input: change.input,
          }
        : {
            status: change.status,
            waitingFor: change.waitingFor,
            deadlineAt: change.deadlineAt,
            input: change.input,
          };
    case 'retrying':
      return {
        ...waiting,
        status: change.status,
        runAt: change.runAt,
        error: change.error,
        input: change.input,
      };
    case 'failed':
      return {
        ...waiting,
        status: change.status,
        port: change.port ?? null,
        error: change.error,
        input: change.input,
      };
    case 'timed_out':
      return {
        ...waiting,
        status: change.status,
        port: change.port ?? null,
        error: change.error,
      };
  }
}
