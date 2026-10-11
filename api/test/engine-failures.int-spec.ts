import { sql } from 'drizzle-orm';
import { httpRequestNode } from '../src/modules/nodes/data/http-request.node';
import { edge, EngineHarness, node } from './support/engine-harness';
import { TestServer } from './support/test-server';

describe('engine: failures and recovery', () => {
  let engine: EngineHarness;
  const server = new TestServer();

  const callFlow = (withErrorPort = false) =>
    engine.publish({
      nodes: [
        node('start', 'trigger.manual'),
        node('call', 'http.request', { url: server.url('/render') }),
        node('alert', 'data.set', {
          fields: { message: 'Render failed: {{ steps.call.error.message }}' },
        }),
        node('ok', 'data.set', { fields: { ok: true } }),
      ].filter((n) => withErrorPort || n.id !== 'alert'),
      edges: [
        edge('start', 'call'),
        edge('call', 'ok'),
        ...(withErrorPort ? [edge('call', 'alert', 'error')] : []),
      ],
    });

  beforeAll(async () => {
    engine = await EngineHarness.create();
    await server.start();
  });
  afterAll(async () => {
    await server.stop();
    await engine.close();
  });
  beforeEach(() => engine.reset());

  it('retries a flaky service with backoff until it answers', async () => {
    server.reply(
      { status: 503 },
      { status: 503 },
      { status: 200, body: { url: 'post.png' } },
    );
    const runId = await engine.start(await callFlow());

    await engine.worker.drain();
    let call = (await engine.run(runId)).steps.find(
      (s) => s.nodeId === 'call',
    )!;
    expect(call.status).toBe('retrying');
    expect(call.runAt.getTime()).toBeGreaterThan(Date.now() - 1_000);

    for (let i = 0; i < 2; i++) {
      await engine.makeDue();
      await engine.worker.drain();
    }
    const run = await engine.run(runId);
    call = run.steps.find((s) => s.nodeId === 'call')!;
    expect(run.status).toBe('succeeded');
    expect(call.output).toEqual({ status: 200, body: { url: 'post.png' } });
    expect(call.attempts.map((a) => a.outcome)).toEqual([
      'retrying',
      'retrying',
      'succeeded',
    ]);
    expect(server.received).toHaveLength(3);
  });

  it('fails the run once attempts run out', async () => {
    server.reply({ status: 503 });
    const runId = await engine.start(await callFlow());
    for (let i = 0; i < 4; i++) {
      await engine.makeDue();
      await engine.worker.drain();
    }
    const run = await engine.run(runId);
    expect(run.status).toBe('failed');
    expect(run.finishedAt).not.toBeNull();
    expect(run.steps.find((s) => s.nodeId === 'call')?.error).toEqual({
      kind: 'http',
      status: 503,
      message: '503 Service Unavailable',
    });
    expect(server.received).toHaveLength(3);
  });

  it('does not retry errors that would repeat, and follows the error port', async () => {
    server.reply({ status: 404 });
    const runId = await engine.start(await callFlow(true));
    await engine.worker.drain();

    expect(await engine.statuses(runId)).toEqual({
      run: 'succeeded',
      steps: {
        start: 'succeeded',
        call: 'failed',
        alert: 'succeeded',
        ok: 'skipped',
      },
    });
    const run = await engine.run(runId);
    expect(run.steps.find((s) => s.nodeId === 'alert')?.output).toEqual({
      message: 'Render failed: 404 Not Found',
    });
    expect(server.received).toHaveLength(1);
  });

  it('times out an attempt that never answers and retries it', async () => {
    const original = httpRequestNode.timeoutMs;
    httpRequestNode.timeoutMs = 300;
    try {
      server.reply('hang', { status: 200 });
      const runId = await engine.start(await callFlow());
      await engine.worker.drain();

      const call = (await engine.run(runId)).steps.find(
        (s) => s.nodeId === 'call',
      )!;
      expect(call.status).toBe('retrying');
      expect(call.error?.kind).toBe('timeout');

      await engine.makeDue();
      await engine.worker.drain();
      expect((await engine.run(runId)).status).toBe('succeeded');
    } finally {
      httpRequestNode.timeoutMs = original;
    }
  });

  it('reclaims a step whose worker died, and drops the dead worker’s result', async () => {
    server.reply({ status: 200 });
    const runId = await engine.start(await callFlow());

    // A worker claims the step and then crashes before finishing it.
    const [lost] = await engine.queue.claim(1, 30_000);
    expect(lost.nodeId).toBe('call');
    await engine.worker.drain();
    expect((await engine.statuses(runId)).steps.call).toBe('running');

    // Its lease expires; the reaper puts the step back in the queue.
    await engine.db.execute(sql`
      UPDATE relay.step_runs SET lease_until = now() - interval '1 second'
      WHERE id = ${lost.id}`);
    await engine.worker.reap();
    await engine.worker.drain();

    const run = await engine.run(runId);
    const call = run.steps.find((s) => s.nodeId === 'call')!;
    expect(run.status).toBe('succeeded');
    expect(call.attempt).toBe(2);

    // The crashed worker wakes up late: its stale attempt is ignored.
    const kept = await engine.advancer.finish(
      lost,
      { status: 'failed', error: { kind: 'unknown', message: 'late' } },
      new Date(),
    );
    expect(kept).toBe(false);
    expect((await engine.run(runId)).status).toBe('succeeded');
  });
});
