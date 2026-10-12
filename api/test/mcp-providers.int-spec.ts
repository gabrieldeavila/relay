import { sql } from 'drizzle-orm';
import { existsSync } from 'node:fs';
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
import { FakeMcpHttp } from './support/fake-mcp-http';

const FAKE_SERVER = join(__dirname, 'support', 'fake-mcp-server.mjs');
/** Quoted: the path may contain spaces. */
const COMMAND = `"${process.execPath}" "${FAKE_SERVER}"`;

describe('MCP servers as providers', () => {
  let engine: EngineHarness;
  const http = new FakeMcpHttp();

  beforeAll(async () => {
    process.env.FILES_DIR = join(tmpdir(), `relay-test-files-${process.pid}`);
    engine = await EngineHarness.create();
    await http.start();
  });
  afterAll(async () => {
    await http.stop();
    await engine.close();
  });
  beforeEach(async () => {
    await engine.reset();
    await engine.db.execute(sql`DELETE FROM relay.tool_providers`);
  });

  const providers = () => engine.get(ProvidersController);
  const connectCommand = () =>
    providers().create(TEST_OWNER, {
      name: 'Fake',
      kind: 'mcp_stdio',
      command: COMMAND,
    });

  /** Runs one tool step after a manual start and returns it. */
  async function runTool(type: string, config: Record<string, unknown> = {}) {
    const workflowId = await engine.publish({
      nodes: [node('start', 'trigger.manual'), node('tool', type, config)],
      edges: [edge('start', 'tool')],
    });
    const runId = await engine.start(workflowId);
    await engine.worker.drain();
    return (await engine.run(runId)).steps.find((s) => s.nodeId === 'tool')!;
  }

  it('reads the tools of a server started as a command', async () => {
    const provider = await connectCommand();
    expect(provider).toMatchObject({
      kind: 'mcp_stdio',
      baseUrl: null,
      toolCount: 4,
    });
    // Shown without quotes where none are needed.
    expect(provider.address).toContain('fake-mcp-server.mjs');
    const catalog = await engine.get(NodesController).list(TEST_OWNER);
    expect(
      catalog.find((n) => n.type === `tool:${provider.id}:echo`),
    ).toMatchObject({
      title: 'Echo',
      group: 'Fake',
      configSchema: { required: ['text'] },
    });
  });

  it('calls tools with resolved values and keeps one server running', async () => {
    const { id } = await connectCommand();
    const echo = await runTool(`tool:${id}:echo`, { text: 'hi' });
    expect(echo.status).toBe('succeeded');
    expect(echo.output).toEqual({
      text: 'echo: hi',
      data: { length: 2 },
      image: null,
    });

    const first = await runTool(`tool:${id}:process_id`);
    const second = await runTool(`tool:${id}:process_id`);
    expect((first.output as { text: string }).text).toMatch(/^\d+$/);
    expect(second.output).toEqual(first.output);
  });

  it('saves returned pictures as run files', async () => {
    const { id } = await connectCommand();
    const step = await runTool(`tool:${id}:picture`);
    const image = (step.output as { image: { path: string; mimeType: string } })
      .image;
    expect(image.mimeType).toBe('image/png');
    expect(existsSync(image.path)).toBe(true);
  });

  it('fails without retrying when the tool says no', async () => {
    const { id } = await connectCommand();
    const step = await runTool(`tool:${id}:refuse`);
    expect(step.status).toBe('failed');
    expect(step.attempt).toBe(1);
    expect(step.error).toEqual({ kind: 'invalid', message: 'Not today' });
  });

  it('says why a command does not start', async () => {
    await expect(
      providers().create(TEST_OWNER, {
        name: 'Broken',
        kind: 'mcp_stdio',
        command: `"${process.execPath}" -e "console.error('missing token'); process.exit(1)"`,
      }),
    ).rejects.toThrow(/Could not read the tools[\s\S]*missing token/);
  });

  it('reaches servers over HTTP too', async () => {
    const provider = await providers().create(TEST_OWNER, {
      name: 'Remote',
      kind: 'mcp_http',
      baseUrl: http.url,
    });
    expect(provider).toMatchObject({ address: http.url, toolCount: 1 });
    const step = await runTool(`tool:${provider.id}:echo`, {
      text: '{{ run.id }}',
    });
    expect(step.output).toMatchObject({ text: `echo: ${step.runId}` });
  });

  it('closes the server when it is disconnected', async () => {
    const { id } = await connectCommand();
    const step = await runTool(`tool:${id}:process_id`);
    const pid = Number((step.output as { text: string }).text);
    await providers().remove(TEST_OWNER, id);
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(() => process.kill(pid, 0)).toThrow();
  });
});
