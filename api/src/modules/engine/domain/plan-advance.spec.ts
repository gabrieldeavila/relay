import { indexGraph } from '../../workflows/domain/graph-index.js';
import { testGraph } from '../../workflows/domain/test-graph.js';
import { planAdvance } from './plan-advance.js';
import type { StepState } from './step-status.js';

// t → check ─true→ yes
//           └false→ no
const index = indexGraph(
  testGraph(
    ['t:manual', 'check:if', 'yes:log', 'no:log'],
    ['t->check', 'check.true->yes', 'check.false->no'],
  ),
);
const done = (port = 'out'): StepState => ({ status: 'succeeded', port });

describe('planAdvance', () => {
  it('creates the next steps and keeps the run going', () => {
    expect(planAdvance(index, new Map([['t', done()]]))).toEqual({
      ready: ['check'],
      skipped: [],
      status: 'running',
    });
  });

  it('finishes the run when the last step settles', () => {
    const steps = new Map<string, StepState>([
      ['t', done()],
      ['check', done('false')],
      ['no', done()],
      ['yes', { status: 'skipped' }],
    ]);
    expect(planAdvance(index, steps)).toEqual({
      ready: [],
      skipped: [],
      status: 'succeeded',
    });
  });

  it('counts skips it creates when finishing the run', () => {
    const steps = new Map<string, StepState>([
      ['t', done()],
      ['check', done('true')],
      ['yes', done()],
    ]);
    expect(planAdvance(index, steps)).toEqual({
      ready: [],
      skipped: ['no'],
      status: 'succeeded',
    });
  });

  it('stops scheduling once the run failed', () => {
    const steps = new Map<string, StepState>([
      ['t', done()],
      ['check', { status: 'failed' }],
    ]);
    expect(planAdvance(index, steps)).toEqual({
      ready: [],
      skipped: [],
      status: 'failed',
    });
  });
});
