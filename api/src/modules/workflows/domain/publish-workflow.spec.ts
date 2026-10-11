import type { WorkflowGraph } from './graph.js';
import { PublishWorkflow } from './publish-workflow.js';
import { findTestSpec, testGraph } from './test-graph.js';
import type { Workflow, WorkflowRepository } from './workflow.js';

function memoryRepository(draftGraph: WorkflowGraph) {
  const versions: WorkflowGraph[] = [];
  const workflow: Workflow = {
    id: 'wf',
    name: 'Weekly post',
    draftGraph,
    latestVersion: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const repository: Pick<WorkflowRepository, 'find' | 'addVersion'> = {
    find: (id) => Promise.resolve(id === workflow.id ? workflow : null),
    addVersion: (_id, graph) => Promise.resolve(versions.push(graph)),
  };
  const registered: unknown[] = [];
  const triggers = {
    register: (_id: string, registration: unknown) =>
      Promise.resolve(void registered.push(registration)),
  };
  return {
    repository: repository as WorkflowRepository,
    versions,
    triggers,
    registered,
  };
}

describe('PublishWorkflow', () => {
  it('stores the draft as the next version', async () => {
    const graph = testGraph(['t:manual', 'a:log'], ['t->a']);
    const { repository, versions, triggers, registered } =
      memoryRepository(graph);
    const publish = new PublishWorkflow(repository, findTestSpec, triggers);

    expect(await publish.execute('wf')).toEqual({
      type: 'published',
      version: 1,
    });
    expect(await publish.execute('wf')).toEqual({
      type: 'published',
      version: 2,
    });
    expect(versions).toEqual([graph, graph]);
    expect(registered).toEqual([null, null]);
  });

  it('refuses a draft that cannot run', async () => {
    const { repository, versions, triggers } = memoryRepository(
      testGraph(['a:log'], []),
    );
    expect(
      await new PublishWorkflow(repository, findTestSpec, triggers).execute(
        'wf',
      ),
    ).toEqual({ type: 'invalid', issues: [{ code: 'no_trigger' }] });
    expect(versions).toEqual([]);
  });

  it('reports a missing workflow', async () => {
    const { repository, triggers } = memoryRepository(testGraph([], []));
    expect(
      await new PublishWorkflow(repository, findTestSpec, triggers).execute(
        'other',
      ),
    ).toEqual({ type: 'not_found' });
  });
});
