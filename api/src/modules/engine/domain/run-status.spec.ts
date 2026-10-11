import { runStatus } from './run-status.js';
import type { StepState } from './step-status.js';
import { canTransition } from './step-transitions.js';

const ok: StepState = { status: 'succeeded', port: 'out' };

describe('runStatus', () => {
  it('is running while any step is still active', () => {
    expect(runStatus([ok, { status: 'running' }, { status: 'waiting' }])).toBe(
      'running',
    );
  });

  it('is waiting when only waiting steps are left', () => {
    expect(runStatus([ok, { status: 'waiting' }])).toBe('waiting');
  });

  it('succeeds when every step is settled', () => {
    expect(runStatus([ok, { status: 'skipped' }])).toBe('succeeded');
  });

  it('fails on an unhandled failure or timeout', () => {
    expect(runStatus([ok, { status: 'failed' }])).toBe('failed');
    expect(runStatus([ok, { status: 'timed_out' }])).toBe('failed');
  });

  it('keeps going after a failure routed to a port', () => {
    expect(runStatus([{ status: 'failed', port: 'error' }, ok])).toBe(
      'succeeded',
    );
  });
});

describe('canTransition', () => {
  it('allows a crashed step to be reclaimed', () => {
    expect(canTransition('running', 'ready')).toBe(true);
  });

  it('never leaves a terminal status', () => {
    expect(canTransition('succeeded', 'ready')).toBe(false);
    expect(canTransition('failed', 'retrying')).toBe(false);
  });

  it('does not run a step that is not ready', () => {
    expect(canTransition('pending', 'running')).toBe(false);
    expect(canTransition('skipped', 'running')).toBe(false);
  });
});
