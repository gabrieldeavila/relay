import { sql } from 'drizzle-orm';
import { existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { NodesController } from '../src/modules/nodes/delivery/nodes.controller';
import { ProvidersController } from '../src/modules/providers/delivery/providers.controller';
import {
  edge,
  EngineHarness,
  node,
  TEST_OWNER,
} from './support/engine-harness';
import { FakeToolApp } from './support/fake-tool-app';

const PNG = Buffer.from('fake-png-bytes');
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('tool providers', () => {
  let engine: EngineHarness;
  const app = new FakeToolApp(
    [
      {
        name: 'draw_text',
        input_schema: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            size: { type: 'number', default: 48 },
          },
          required: ['text'],
        },
      },
      {
        name: 'render_image',
        input_schema: { type: 'object', properties: {} },
      },
      { name: 'slow', input_schema: { type: 'object', properties: {} } },
    ],
    {
      draw_text: (input) =>
        Promise.resolve(
          input.text === 'boom'
            ? { status: 400, body: { error: 'text: too explosive' } }
            : {
                body: {
                  text: `Drew ${String(input.text)}`,
                  data: { layerId: 'L1' },
                },
              },
        ),
      render_image: () =>
        Promise.resolve({
          body: { text: 'Rendered', image: PNG.toString('base64') },
        }),
      slow: async () => {
        await sleep(30);
        return { body: { text: 'ok' } };
      },
    },
  );
  let tool: (name: string) => string;

  beforeAll(async () => {
    process.env.FILES_DIR = join(tmpdir(), `relay-test-files-${process.pid}`);
    engine = await EngineHarness.create();
    await app.start();
  });
  afterAll(async () => {
    await app.stop();
    await engine.close();
  });
  beforeEach(async () => {
    await engine.reset();
    await engine.db.execute(sql`DELETE FROM relay.tool_providers`);
    const provider = await engine
      .get(ProvidersController)
      .create(TEST_OWNER, { name: 'Pincel', baseUrl: `${app.url}/` });
    tool = (name) => `tool:${provider.id}:${name}`;
    app.calls.length = 0;
    app.maxConcurrent = 0;
  });

  it('lists the connected app’s tools in the node catalog', async () => {
    const catalog = await engine.get(NodesController).list(TEST_OWNER);
    expect(catalog.find((n) => n.type === tool('draw_text'))).toMatchObject({
      title: 'Draw text',
      group: 'Pincel',
      outputPorts: ['out', 'error'],
      configSchema: { required: ['text'] },
    });
    expect(
      await engine
        .get(NodesController)
        .list('00000000-0000-4000-8000-0000000000ff'),
    ).not.toContainEqual(expect.objectContaining({ group: 'Pincel' }));
  });

  it('calls tools with resolved values and keeps returned images as files', async () => {
    const workflowId = await engine.publish({
      nodes: [
        node('start', 'trigger.manual'),
        node('draw_text', tool('draw_text'), { text: '{{ trigger.title }}' }),
        node('render_image', tool('render_image')),
        node('save', 'data.set', {
          fields: { file: '{{ steps.render_image.output.image.path }}' },
        }),
      ],
      edges: [
        edge('start', 'draw_text'),
        edge('draw_text', 'render_image'),
        edge('render_image', 'save'),
      ],
    });
    const runId = await engine.start(workflowId, { title: 'Fall sale' });
    await engine.worker.drain();

    const run = await engine.run(runId);
    expect(run.status).toBe('succeeded');
    expect(app.calls[0]).toEqual({
      tool: 'draw_text',
      input: { text: 'Fall sale', size: 48 },
    });
    const image = (
      run.steps.find((s) => s.nodeId === 'render_image')?.output as {
        image: { path: string; url: string; mimeType: string };
      }
    ).image;
    expect(image).toMatchObject({
      mimeType: 'image/png',
      url: `http://localhost:4400/files/${runId}/render_image-1.png`,
    });
    expect(existsSync(image.path) && readFileSync(image.path)).toEqual(PNG);
    expect(run.steps.find((s) => s.nodeId === 'save')?.output).toEqual({
      file: image.path,
    });
  });

  it('fails at once when the tool refuses the input', async () => {
    const workflowId = await engine.publish({
      nodes: [
        node('start', 'trigger.manual'),
        node('draw', tool('draw_text'), { text: 'boom' }),
      ],
      edges: [edge('start', 'draw')],
    });
    const runId = await engine.start(workflowId);
    await engine.worker.drain();

    const run = await engine.run(runId);
    expect(run.status).toBe('failed');
    expect(run.steps.find((s) => s.nodeId === 'draw')?.error).toEqual({
      kind: 'invalid',
      message: 'text: too explosive',
    });
    expect(app.calls).toHaveLength(1);
  });

  it('never overlaps calls to the same app, even on parallel branches', async () => {
    const branches = ['a', 'b', 'c', 'd'];
    const workflowId = await engine.publish({
      nodes: [
        node('start', 'trigger.manual'),
        ...branches.map((id) => node(id, tool('slow'))),
      ],
      edges: branches.map((id) => edge('start', id)),
    });
    const runId = await engine.start(workflowId);
    await engine.worker.drain();

    expect((await engine.run(runId)).status).toBe('succeeded');
    expect(app.calls).toHaveLength(4);
    expect(app.maxConcurrent).toBe(1);
  });

  it('checks required tool fields at publish, and hides other people’s tools', async () => {
    const missing = await engine.tryPublish({
      nodes: [node('start', 'trigger.manual'), node('draw', tool('draw_text'))],
      edges: [edge('start', 'draw')],
    });
    expect(missing).toMatchObject({
      type: 'invalid',
      issues: [{ code: 'missing_config', nodeId: 'draw', field: 'text' }],
    });

    const foreign = await engine.tryPublish({
      nodes: [
        node('start', 'trigger.manual'),
        node('x', 'tool:00000000-0000-4000-8000-000000000999:draw_text'),
      ],
      edges: [edge('start', 'x')],
    });
    expect(foreign).toMatchObject({
      type: 'invalid',
      issues: [{ code: 'unknown_node_type', nodeId: 'x' }],
    });
  });

  it('refuses an address that does not serve tools', async () => {
    await expect(
      engine
        .get(ProvidersController)
        .create(TEST_OWNER, { name: 'Nope', baseUrl: `${app.url}/nothing` }),
    ).rejects.toThrow(/Could not read the tools/);
  });
});
