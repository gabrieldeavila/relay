import type { WorkflowGraph } from './graph.js';
import { StartDraftTest } from './start-draft-test.js';
import { findTestSpec, testGraph } from './test-graph.js';
import type { Workflow, WorkflowRepository } from './workflow.js';

const specsFor = () => Promise.resolve(findTestSpec);

function setup(draftGraph: WorkflowGraph) {
  const workflow: Workflow = {
    id: 'wf',
    name: 'Weekly post',
    draftGraph,
    latestVersion: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const repository: Pick<WorkflowRepository, 'find' | 'addVersion'> = {
    find: (id, ownerId) =>
      Promise.resolve(
        id === workflow.id && ownerId === 'ana' ? workflow : null,
      ),
    addVersion: () => Promise.reject(new Error('a test never publishes')),
  };
  const started: { graph: WorkflowGraph; payload: unknown }[] = [];
  const test = new StartDraftTest(
    repository as WorkflowRepository,
    specsFor,
    (_id, graph, payload) =>
      Promise.resolve(`run-${started.push({ graph, payload })}`),
  );
  return { test, started };
}

describe('StartDraftTest', () => {
  it('runs the draft as it is, with the given payload', async () => {
    const graph = testGraph(['t:manual', 'a:log'], ['t->a']);
    const { test, started } = setup(graph);

    expect(await test.execute('wf', 'ana', { name: 'Ana' })).toEqual({
      type: 'started',
      runId: 'run-1',
    });
    expect(started).toEqual([{ graph, payload: { name: 'Ana' } }]);
  });

  it('refuses a draft that cannot run, without starting anything', async () => {
    const { test, started } = setup(testGraph(['a:log'], []));

    const result = await test.execute('wf', 'ana', {});

    expect(result.type).toBe('invalid');
    expect(started).toEqual([]);
  });

  it('hides workflows of other owners', async () => {
    const { test } = setup(testGraph(['t:manual'], []));

    expect(await test.execute('wf', 'bia', {})).toEqual({
      type: 'not_found',
    });
  });
});
