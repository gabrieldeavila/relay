import {
  edge,
  EngineHarness,
  node,
  TEST_OWNER,
} from './support/engine-harness';
import { TestServer } from './support/test-server';
import { RunReader } from '../src/modules/engine/data/run-reader';
import { StartDraftTest } from '../src/modules/workflows/domain/start-draft-test';

describe('engine: flows', () => {
  let engine: EngineHarness;
  const server = new TestServer();

  beforeAll(async () => {
    engine = await EngineHarness.create();
    await server.start();
  });
  afterAll(async () => {
    await server.stop();
    await engine.close();
  });
  beforeEach(() => engine.reset());

  it('reports the latest published version in the list and the detail', async () => {
    const graph = {
      nodes: [node('start', 'trigger.manual')],
      edges: [],
    };
    const workflowId = await engine.publish(graph);
    await engine.publish(graph, workflowId);

    expect(
      (await engine.workflows.find(workflowId, TEST_OWNER))?.latestVersion,
    ).toBe(2);
    expect(
      (await engine.workflows.list(TEST_OWNER)).find((w) => w.id === workflowId)
        ?.latestVersion,
    ).toBe(2);
    const draft = await engine.workflows.create(TEST_OWNER, 'Draft only');
    expect(
      (await engine.workflows.find(draft.id, TEST_OWNER))?.latestVersion,
    ).toBeNull();
  });

  it('tests the draft without publishing it or touching the published flow', async () => {
    const published = {
      nodes: [node('start', 'trigger.manual'), node('a', 'data.set', { fields: { n: 1 } })],
      edges: [edge('start', 'a')],
    };
    const workflowId = await engine.publish(published);
    const draft = {
      nodes: [...published.nodes, node('b', 'data.set', { fields: { n: 2 } })],
      edges: [...published.edges, edge('a', 'b')],
    };
    await engine.workflows.update(workflowId, TEST_OWNER, {
      draftGraph: draft,
    });

    const test = await engine
      .get(StartDraftTest)
      .execute(workflowId, TEST_OWNER, {});
    if (test.type !== 'started') throw new Error(JSON.stringify(test));
    const realRunId = await engine.start(workflowId);
    await engine.worker.drain();

    expect((await engine.statuses(test.runId)).steps).toEqual({
      start: 'succeeded',
      a: 'succeeded',
      b: 'succeeded',
    });
    expect(Object.keys((await engine.statuses(realRunId)).steps)).toEqual([
      'start',
      'a',
    ]);
    expect(
      (await engine.workflows.find(workflowId, TEST_OWNER))?.latestVersion,
    ).toBe(1);
    const listed = await engine
      .get(RunReader)
      .listForWorkflow(workflowId, TEST_OWNER);
    expect(listed.map((run) => [run.id, run.version])).toEqual(
      expect.arrayContaining([
        [test.runId, null],
        [realRunId, 1],
      ]),
    );
  });

  it('refuses to test a draft that cannot run', async () => {
    const { id } = await engine.workflows.create(TEST_OWNER, 'Empty');

    expect(
      (await engine.get(StartDraftTest).execute(id, TEST_OWNER, {})).type,
    ).toBe('invalid');
  });

  it('passes data between steps through expressions', async () => {
    server.reply({ status: 200, body: { saved: true } });
    const workflowId = await engine.publish({
      nodes: [
        node('start', 'trigger.manual'),
        node('greeting', 'data.set', {
          fields: { text: 'Hi {{ trigger.name }}' },
        }),
        node('save', 'http.request', {
          url: server.url('/posts'),
          method: 'POST',
          body: { message: '{{ steps.greeting.output.text }}' },
        }),
      ],
      edges: [edge('start', 'greeting'), edge('greeting', 'save')],
    });

    const runId = await engine.start(workflowId, { name: 'Ana' });
    await engine.worker.drain();

    expect(await engine.statuses(runId)).toEqual({
      run: 'succeeded',
      steps: { start: 'succeeded', greeting: 'succeeded', save: 'succeeded' },
    });
    expect(server.received[0].body).toEqual({ message: 'Hi Ana' });
    expect(server.received[0].headers['idempotency-key']).toMatch(
      new RegExp(`^${runId}:save:1$`),
    );
  });

  it('takes one branch, skips the other, and merges', async () => {
    const workflowId = await engine.publish({
      nodes: [
        node('start', 'trigger.manual'),
        node('check', 'logic.if', {
          value: '{{ trigger.total }}',
          operator: 'greater_than',
          compare: 100,
        }),
        node('big', 'data.set', { fields: { size: 'big' } }),
        node('small', 'data.set', { fields: { size: 'small' } }),
        node('end', 'data.set', { fields: { done: true } }),
      ],
      edges: [
        edge('start', 'check'),
        edge('check', 'big', 'true'),
        edge('check', 'small', 'false'),
        edge('big', 'end'),
        edge('small', 'end'),
      ],
    });

    const runId = await engine.start(workflowId, { total: '250' });
    await engine.worker.drain();

    expect(await engine.statuses(runId)).toEqual({
      run: 'succeeded',
      steps: {
        start: 'succeeded',
        check: 'succeeded',
        big: 'succeeded',
        small: 'skipped',
        end: 'succeeded',
      },
    });
  });

  it('runs parallel branches and joins them once', async () => {
    const workflowId = await engine.publish({
      nodes: [
        node('start', 'trigger.manual'),
        ...['a', 'b', 'c'].map((id) =>
          node(id, 'data.set', { fields: { id } }),
        ),
        node('join', 'data.set', {
          fields: {
            all: '{{ steps.a.output.id }}{{ steps.b.output.id }}{{ steps.c.output.id }}',
          },
        }),
      ],
      edges: ['a', 'b', 'c'].flatMap((id) => [
        edge('start', id),
        edge(id, 'join'),
      ]),
    });

    const runId = await engine.start(workflowId);
    await engine.worker.drain();

    const run = await engine.run(runId);
    expect(run.status).toBe('succeeded');
    const joins = run.steps.filter((step) => step.nodeId === 'join');
    expect(joins).toHaveLength(1);
    expect(joins[0].output).toEqual({ all: 'abc' });
  });

  it('sleeps on a delay without holding a worker, then goes on', async () => {
    const workflowId = await engine.publish({
      nodes: [
        node('start', 'trigger.manual'),
        node('wait', 'flow.delay', { amount: 2, unit: 'hours' }),
        node('after', 'data.set', { fields: { ok: true } }),
      ],
      edges: [edge('start', 'wait'), edge('wait', 'after')],
    });

    const runId = await engine.start(workflowId);
    await engine.worker.drain();
    expect(await engine.statuses(runId)).toEqual({
      run: 'waiting',
      steps: { start: 'succeeded', wait: 'waiting' },
    });

    await engine.makeDue();
    await engine.worker.drain();
    const run = await engine.run(runId);
    expect(run.status).toBe('succeeded');
    expect(run.steps.find((step) => step.nodeId === 'wait')?.attempt).toBe(1);
  });

  it('cancels a waiting run', async () => {
    const workflowId = await engine.publish({
      nodes: [
        node('start', 'trigger.manual'),
        node('wait', 'flow.delay', { amount: 1, unit: 'days' }),
      ],
      edges: [edge('start', 'wait')],
    });
    const runId = await engine.start(workflowId);
    await engine.worker.drain();

    expect(await engine.canceller.cancelRun(runId)).toBe(true);
    await engine.makeDue();
    await engine.worker.drain();
    expect(await engine.statuses(runId)).toEqual({
      run: 'cancelled',
      steps: { start: 'succeeded', wait: 'cancelled' },
    });
  });
});
