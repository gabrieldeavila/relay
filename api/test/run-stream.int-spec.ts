import { filter, firstValueFrom, map, takeWhile, timeout, toArray } from 'rxjs';
import { RunStream } from '../src/modules/engine/data/run-stream';
import {
  edge,
  EngineHarness,
  node,
  TEST_OWNER,
} from './support/engine-harness';
import { startHttpApp, tokenFor } from './support/http-harness';

describe('live run updates', () => {
  let engine: EngineHarness;

  beforeAll(async () => {
    engine = await EngineHarness.create();
  });
  afterAll(() => engine.close());
  beforeEach(() => engine.reset());

  const twoSteps = () =>
    engine.publish({
      nodes: [
        node('start', 'trigger.manual'),
        node('set', 'data.set', { fields: { ok: true } }),
      ],
      edges: [edge('start', 'set')],
    });

  it('streams a snapshot now and another after each change (via NOTIFY)', async () => {
    const runId = await engine.start(await twoSteps());
    const stream = engine.get(RunStream).stream(runId, TEST_OWNER);
    type Snapshot = { status: string };
    const snapshots = firstValueFrom(
      stream.pipe(
        filter((event) => event.type === 'run'),
        map((event) => JSON.parse(event.data as string) as Snapshot),
        // Changes close together are coalesced, so count on the end state only.
        takeWhile((run) => run.status !== 'succeeded', true),
        toArray(),
        timeout(5_000),
      ),
    );
    await new Promise((resolve) => setTimeout(resolve, 200));
    await engine.worker.drain();

    const runs = await snapshots;
    expect(runs[0].status).toBe('running');
    expect(runs.at(-1)?.status).toBe('succeeded');
  });

  it('retries a failed run from the step that failed', async () => {
    const workflowId = await engine.publish({
      nodes: [
        node('start', 'trigger.manual'),
        node('done', 'data.set', { fields: { ok: true } }),
        node('wait', 'flow.wait_for_webhook', {
          timeoutAmount: 1,
          timeoutUnit: 'minutes',
        }),
        node('after', 'data.set', {
          fields: { got: '{{ steps.wait.output.v }}' },
        }),
      ],
      edges: [
        edge('start', 'done'),
        edge('done', 'wait'),
        edge('wait', 'after'),
      ],
    });
    const runId = await engine.start(workflowId);
    await engine.worker.drain();
    await engine.passDeadlines();
    await engine.deadlines.expireDue();
    expect((await engine.run(runId)).status).toBe('failed');

    expect(await engine.retrier.retry(runId)).toBe(true);
    await engine.worker.drain();
    const { resumeToken } = await engine.run(runId);
    await engine.resumer.deliver({
      resumeToken,
      nodeId: 'wait',
      action: null,
      payload: { v: 7 },
      dedupeKey: 'k',
    });
    await engine.worker.drain();

    const run = await engine.run(runId);
    expect(run.status).toBe('succeeded');
    expect(run.steps.find((s) => s.nodeId === 'after')?.output).toEqual({
      got: 7,
    });
    expect(run.steps.find((s) => s.nodeId === 'done')?.attempts).toHaveLength(
      1,
    );
    expect(
      run.steps
        .find((s) => s.nodeId === 'wait')
        ?.attempts.map((a) => a.outcome),
    ).toEqual(['waiting', 'timed_out', 'waiting', 'succeeded']);
    expect(await engine.retrier.retry(runId)).toBe(false);
  });
});

describe('live run updates over HTTP', () => {
  let http: Awaited<ReturnType<typeof startHttpApp>>;
  const ANA = '00000000-0000-4000-8000-00000000000a';

  beforeAll(async () => {
    http = await startHttpApp();
  });
  afterAll(() => http.app.close());

  it('answers 404 before opening a stream for an unknown run', async () => {
    const response = await http.call(
      '/runs/00000000-0000-4000-8000-000000000999/events',
      await tokenFor(ANA),
    );
    expect(response.status).toBe(404);
  });

  it('sends the run as an event stream', async () => {
    const token = await tokenFor(ANA);
    const json = async (path: string, body?: unknown) =>
      (
        await http.call(path, token, {
          method: 'POST',
          body: JSON.stringify(body ?? {}),
        })
      ).json() as Promise<{ id: string }>;
    const { id } = await json('/workflows', { name: 'Stream' });
    await http.call(`/workflows/${id}`, token, {
      method: 'PATCH',
      body: JSON.stringify({
        draftGraph: {
          nodes: [
            {
              id: 'start',
              type: 'trigger.manual',
              config: {},
              position: { x: 0, y: 0 },
            },
          ],
          edges: [],
        },
      }),
    });
    await json(`/workflows/${id}/publish`);
    const run = await json(`/workflows/${id}/runs`);

    const controller = new AbortController();
    const response = await http.call(`/runs/${run.id}/events`, token, {
      signal: controller.signal,
    });
    expect(response.headers.get('content-type')).toContain('text/event-stream');
    const reader = response.body!.getReader();
    let text = '';
    while (!text.includes('\n\n') || !text.includes('event: run')) {
      const { value, done } = await reader.read();
      if (done) break;
      text += new TextDecoder().decode(value);
    }
    controller.abort();

    expect(text).toMatch(/^event: run\n/m);
    expect(text).toContain(`"id":"${run.id}"`);
    expect(text).toContain('"graph":');
  });
});
