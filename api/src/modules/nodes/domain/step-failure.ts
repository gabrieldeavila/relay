import type { StepError } from '../../engine/domain/step-error.js';

/** Thrown by nodes that already know what kind of failure happened. */
export class StepFailure extends Error {
  constructor(readonly error: StepError) {
    super(error.message);
  }
}
