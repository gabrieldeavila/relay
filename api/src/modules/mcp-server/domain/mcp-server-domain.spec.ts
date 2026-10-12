import { runReport } from './run-report.js';
import { trimValue } from './trim-value.js';

describe('trimValue', () => {
  it('leaves small values alone and shortens big ones', () => {
    expect(trimValue({ a: 1 })).toEqual({ a: 1 });
    expect(trimValue(undefined)).toBeNull();
    const big = trimValue('x'.repeat(50), 10);
    expect(big).toBe(`"xxxxxxxxx… (42 more characters; see the run page)`);
  });
});

describe('runReport', () => {
  it('lists each step’s outcome with a link to the run', () => {
    const report = runReport(
      {
        id: 'r1',
        workflowId: 'w1',
        status: 'failed',
        version: 3,
        createdAt: new Date('2026-10-12T10:00:00Z'),
        finishedAt: null,
        steps: [
          {
            nodeId: 'start',
            status: 'succeeded',
            port: 'out',
            attempt: 1,
            output: { title: 'Hi' },
            error: null,
          },
          {
            nodeId: 'send',
            status: 'failed',
            port: null,
            attempt: 3,
            output: null,
            error: { kind: 'network', message: 'down' },
          },
        ],
      },
      'http://localhost:5400',
    );
    expect(report).toEqual({
      id: 'r1',
      status: 'failed',
      version: 3,
      startedAt: '2026-10-12T10:00:00.000Z',
      finishedAt: null,
      link: 'http://localhost:5400/workflows/w1/runs/r1',
      steps: [
        {
          id: 'start',
          status: 'succeeded',
          port: 'out',
          attempt: 1,
          output: { title: 'Hi' },
        },
        {
          id: 'send',
          status: 'failed',
          attempt: 3,
          error: { kind: 'network', message: 'down' },
        },
      ],
    });
  });
});
