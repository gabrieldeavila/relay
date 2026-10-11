import { edge, EngineHarness, node } from './support/engine-harness';

describe('engine: waiting for people and other apps', () => {
  let engine: EngineHarness;

  beforeAll(async () => {
    engine = await EngineHarness.create();
  });
  afterAll(() => engine.close());
  beforeEach(() => engine.reset());

  const approvalFlow = (timeout?: { timeoutAmount: number }) =>
    engine.publish({
      nodes: [
        node('start', 'trigger.manual'),
        node('links', 'data.set', {
          fields: { approve: '{{ run.resumeUrl }}/ask/approve' },
        }),
        node('ask', 'flow.approval', { question: 'Post it?', ...timeout }),
        node('post', 'data.set', {
          fields: { by: '{{ steps.ask.output.comment }}' },
        }),
        node('drop', 'data.set', { fields: { dropped: true } }),
        node('late', 'data.set', { fields: { late: true } }),
      ].filter((n) => timeout || n.id !== 'late'),
      edges: [
        edge('start', 'links'),
        edge('links', 'ask'),
        edge('ask', 'post', 'approved'),
        edge('ask', 'drop', 'rejected'),
        ...(timeout ? [edge('ask', 'late', 'timeout')] : []),
      ],
    });

  const answer = async (
    runId: string,
    nodeId: string,
    action: string | null,
    payload: unknown = {},
    dedupeKey = action ?? 'event',
  ) => {
    const { resumeToken } = await engine.run(runId);
    return engine.resumer.deliver({
      resumeToken,
      nodeId,
      action,
      payload,
      dedupeKey,
    });
  };

  it('waits for approval without holding a worker, then follows the answer', async () => {
    const runId = await engine.start(await approvalFlow());
    await engine.worker.drain();

    const waiting = await engine.run(runId);
    expect(waiting.status).toBe('waiting');
    expect(waiting.steps.find((s) => s.nodeId === 'links')?.output).toEqual({
      approve: `http://localhost:4400/resume/${waiting.resumeToken}/ask/approve`,
    });

    expect(await answer(runId, 'ask', 'approve', { comment: 'Ana' })).toBe(
      'resumed',
    );
    await engine.worker.drain();
    const run = await engine.run(runId);
    expect(run.status).toBe('succeeded');
    expect(run.steps.find((s) => s.nodeId === 'post')?.output).toEqual({
      by: 'Ana',
    });
    expect(run.steps.find((s) => s.nodeId === 'drop')?.status).toBe('skipped');
  });

  it('answers each approval only once', async () => {
    const runId = await engine.start(await approvalFlow());
    await engine.worker.drain();

    expect(await answer(runId, 'ask', 'approve')).toBe('resumed');
    expect(await answer(runId, 'ask', 'approve')).toBe('closed');
    expect(await answer(runId, 'ask', 'reject')).toBe('closed');
  });

  it('ignores answers the step does not understand and keeps waiting', async () => {
    const runId = await engine.start(await approvalFlow());
    await engine.worker.drain();

    expect(await answer(runId, 'ask', 'maybe')).toBe('rejected');
    expect((await engine.statuses(runId)).steps.ask).toBe('waiting');
    expect(await answer(runId, 'ask', 'reject')).toBe('resumed');
  });

  it('follows the timeout port when nobody answers in time', async () => {
    const runId = await engine.start(await approvalFlow({ timeoutAmount: 1 }));
    await engine.worker.drain();
    expect(await engine.deadlines.expireDue()).toBe(0);

    await engine.passDeadlines();
    expect(await engine.deadlines.expireDue()).toBe(1);
    await engine.worker.drain();
    expect(await engine.statuses(runId)).toMatchObject({
      run: 'succeeded',
      steps: {
        ask: 'timed_out',
        late: 'succeeded',
        post: 'skipped',
        drop: 'skipped',
      },
    });
  });

  it('fails the run when a deadline passes with no timeout port', async () => {
    const workflowId = await engine.publish({
      nodes: [
        node('start', 'trigger.manual'),
        node('hook', 'flow.wait_for_webhook', {
          timeoutAmount: 5,
          timeoutUnit: 'minutes',
        }),
      ],
      edges: [edge('start', 'hook')],
    });
    const runId = await engine.start(workflowId);
    await engine.worker.drain();
    await engine.passDeadlines();
    await engine.deadlines.expireDue();

    const run = await engine.run(runId);
    expect(run.status).toBe('failed');
    expect(run.steps.find((s) => s.nodeId === 'hook')?.error).toEqual({
      kind: 'timeout',
      message: 'No answer before the deadline',
    });
  });

  it('keeps an event that arrives before the step starts waiting', async () => {
    const workflowId = await engine.publish({
      nodes: [
        node('start', 'trigger.manual'),
        node('pause', 'flow.delay', { amount: 1, unit: 'hours' }),
        node('hook', 'flow.wait_for_webhook'),
        node('use', 'data.set', {
          fields: { got: '{{ steps.hook.output.image }}' },
        }),
      ],
      edges: [
        edge('start', 'pause'),
        edge('pause', 'hook'),
        edge('hook', 'use'),
      ],
    });
    const runId = await engine.start(workflowId);
    await engine.worker.drain();

    expect(await answer(runId, 'hook', null, { image: 'post.png' }, 'k1')).toBe(
      'stored',
    );
    expect(await answer(runId, 'hook', null, { image: 'post.png' }, 'k1')).toBe(
      'duplicate',
    );

    await engine.makeDue();
    await engine.worker.drain();
    const run = await engine.run(runId);
    expect(run.status).toBe('succeeded');
    expect(run.steps.find((s) => s.nodeId === 'use')?.output).toEqual({
      got: 'post.png',
    });
  });

  it('rejects links to unknown runs or steps', async () => {
    const runId = await engine.start(await approvalFlow());
    expect(await answer(runId, 'nope', 'approve')).toBe('not_found');
    expect(
      await engine.resumer.deliver({
        resumeToken: 'forged',
        nodeId: 'ask',
        action: 'approve',
        payload: {},
        dedupeKey: 'x',
      }),
    ).toBe('not_found');
  });
});
