import { approvalDecision } from './approval-decision.js';
import { waitDeadline } from './wait-timeout.js';

const receivedAt = new Date('2026-10-12T15:00:00Z');

describe('approvalDecision', () => {
  it('routes approve and reject to their ports', () => {
    expect(
      approvalDecision({ action: 'approve', payload: {}, receivedAt }),
    ).toEqual({
      port: 'approved',
      output: {
        decision: 'approved',
        comment: null,
        decidedAt: '2026-10-12T15:00:00.000Z',
      },
    });
    expect(
      approvalDecision({
        action: 'reject',
        payload: { comment: ' too dark ' },
        receivedAt,
      })?.output,
    ).toMatchObject({ decision: 'rejected', comment: 'too dark' });
  });

  it('ignores other actions', () => {
    expect(
      approvalDecision({ action: 'maybe', payload: {}, receivedAt }),
    ).toBeNull();
    expect(
      approvalDecision({ action: null, payload: {}, receivedAt }),
    ).toBeNull();
    expect(
      approvalDecision({ action: 'toString', payload: {}, receivedAt }),
    ).toBeNull();
  });
});

describe('waitDeadline', () => {
  it('waits forever without an amount', () => {
    expect(waitDeadline(receivedAt, { timeoutUnit: 'days' })).toBeUndefined();
  });

  it('adds the amount', () => {
    expect(
      waitDeadline(receivedAt, { timeoutAmount: 2, timeoutUnit: 'hours' }),
    ).toEqual(new Date('2026-10-12T17:00:00Z'));
  });
});
