import {
  done,
  sleepUntil,
  waitForEvent,
} from '../../nodes/domain/node-result.js';
import { applyNodeResult } from './apply-node-result.js';

const input = { url: 'https://example.com' };

describe('applyNodeResult', () => {
  it('follows the default port when the node names none', () => {
    expect(applyNodeResult(done({ ok: true }), input)).toEqual({
      status: 'succeeded',
      port: 'out',
      output: { ok: true },
      input,
    });
  });

  it('keeps the port a branching node chose', () => {
    expect(applyNodeResult(done(undefined, 'false'), input)).toMatchObject({
      status: 'succeeded',
      port: 'false',
      output: null,
    });
  });

  it('parks a sleeping step on a timer', () => {
    const until = new Date('2026-10-12T09:00:00Z');
    expect(applyNodeResult(sleepUntil(until), input)).toEqual({
      status: 'waiting',
      waitingFor: 'time',
      runAt: until,
      input,
    });
  });

  it('parks a waiting step until an event, with or without a deadline', () => {
    const deadline = new Date('2026-10-13T09:00:00Z');
    expect(applyNodeResult(waitForEvent(deadline), input)).toMatchObject({
      waitingFor: 'event',
      deadlineAt: deadline,
    });
    expect(applyNodeResult(waitForEvent(), input)).toMatchObject({
      waitingFor: 'event',
      deadlineAt: null,
    });
  });
});
