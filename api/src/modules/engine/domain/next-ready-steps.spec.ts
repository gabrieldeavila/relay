import { indexGraph } from '../../workflows/domain/graph-index.js';
import { testGraph } from '../../workflows/domain/test-graph.js';
import { nextReadySteps } from './next-ready-steps.js';
import type { StepState } from './step-status.js';

const done = (port = 'out'): StepState => ({ status: 'succeeded', port });

// t → check ─true→ yes ─┐
//           └false→ no ─┴→ end
const branching = indexGraph(
  testGraph(
    ['t:manual', 'check:if', 'yes:log', 'no:log', 'end:log'],
    ['t->check', 'check.true->yes', 'check.false->no', 'yes->end', 'no->end'],
  ),
);

describe('nextReadySteps', () => {
  it('starts the nodes right after the trigger', () => {
    const steps = new Map([['t', done()]]);
    expect(nextReadySteps(branching, steps)).toEqual({
      ready: ['check'],
      skipped: [],
    });
  });

  it('never schedules the trigger itself', () => {
    expect(nextReadySteps(branching, new Map())).toEqual({
      ready: [],
      skipped: [],
    });
  });

  it('runs the taken branch and skips the other', () => {
    const steps = new Map<string, StepState>([
      ['t', done()],
      ['check', done('true')],
    ]);
    expect(nextReadySteps(branching, steps)).toEqual({
      ready: ['yes'],
      skipped: ['no'],
    });
  });

  it('runs the merge node once the taken branch finishes', () => {
    const steps = new Map<string, StepState>([
      ['t', done()],
      ['check', done('true')],
      ['yes', done()],
      ['no', { status: 'skipped' }],
    ]);
    expect(nextReadySteps(branching, steps).ready).toEqual(['end']);
  });

  it('waits for every input of a join', () => {
    // t → a ─┐
    //   → b ─┴→ join
    const parallel = indexGraph(
      testGraph(
        ['t:manual', 'a:log', 'b:log', 'join:log'],
        ['t->a', 't->b', 'a->join', 'b->join'],
      ),
    );
    const steps = new Map<string, StepState>([
      ['t', done()],
      ['a', done()],
      ['b', { status: 'running' }],
    ]);
    expect(nextReadySteps(parallel, steps)).toEqual({ ready: [], skipped: [] });
  });

  it('cascades skips down a dead branch', () => {
    // t → check ─true→ a → b → c
    const chain = indexGraph(
      testGraph(
        ['t:manual', 'check:if', 'a:log', 'b:log', 'c:log'],
        ['t->check', 'check.true->a', 'a->b', 'b->c'],
      ),
    );
    const steps = new Map<string, StepState>([
      ['t', done()],
      ['check', done('false')],
    ]);
    expect(nextReadySteps(chain, steps)).toEqual({
      ready: [],
      skipped: ['a', 'b', 'c'],
    });
  });

  it('follows the error port when a failure was routed', () => {
    // t → call ─out→ ok
    //          └error→ alert
    const routed = indexGraph(
      testGraph(
        ['t:manual', 'call:http', 'ok:log', 'alert:log'],
        ['t->call', 'call->ok', 'call.error->alert'],
      ),
    );
    const steps = new Map<string, StepState>([
      ['t', done()],
      ['call', { status: 'failed', port: 'error' }],
    ]);
    expect(nextReadySteps(routed, steps)).toEqual({
      ready: ['alert'],
      skipped: ['ok'],
    });
  });
});
