import {
  Client,
  StreamableHTTPClientTransport,
} from '@modelcontextprotocol/client';
import { sql } from 'drizzle-orm';
import { DATABASE, type Database } from '../src/database/database';
import { startHttpApp, tokenFor } from './support/http-harness';

const ANA = '00000000-0000-4000-8000-00000000000a';
const BIA = '00000000-0000-4000-8000-00000000000b';

type ToolAnswer = {
  isError?: boolean;
  content: { type: string; text: string }[];
};

describe('Relay over MCP', () => {
  let http: Awaited<ReturnType<typeof startHttpApp>>;
  let mcpUrl: string;
  const clients: Client[] = [];

  beforeAll(async () => {
    http = await startHttpApp();
    const port = (
      http.app.getHttpServer() as import('node:http').Server
    ).address();
    mcpUrl = `http://127.0.0.1:${(port as import('node:net').AddressInfo).port}/mcp`;
  });
  afterAll(async () => {
    await Promise.all(clients.map((client) => client.close()));
    await http.app.close();
  });
  beforeEach(async () => {
    const db = http.app.get<Database>(DATABASE);
    await db.execute(sql`DELETE FROM relay.access_tokens`);
    await db.execute(sql`DELETE FROM relay.workflows`);
  });

  async function newToken(userId: string) {
    const response = await http.call('/access-tokens', await tokenFor(userId), {
      method: 'POST',
      body: JSON.stringify({ name: 'Claude Code' }),
    });
    expect(response.status).toBe(201);
    return (await response.json()) as {
      id: string;
      token: string;
      hint: string;
    };
  }

  async function connect(token: string) {
    const client = new Client({ name: 'test', version: '1.0.0' });
    await client.connect(
      new StreamableHTTPClientTransport(new URL(mcpUrl), {
        requestInit: { headers: { authorization: `Bearer ${token}` } },
      }),
    );
    clients.push(client);
    return client;
  }

  async function call(client: Client, name: string, args = {}) {
    const result = (await client.callTool({
      name,
      arguments: args,
    })) as ToolAnswer;
    const text = result.content[0]?.text ?? '';
    return {
      isError: result.isError ?? false,
      text,
      json: () => JSON.parse(text) as Record<string, unknown>,
    };
  }

  it('shows the token once and keeps only a hint', async () => {
    const created = await newToken(ANA);
    expect(created.token).toMatch(/^relay_/);
    const listed = (await (
      await http.call('/access-tokens', await tokenFor(ANA))
    ).json()) as { mcpUrl: string; tokens: Record<string, unknown>[] };
    expect(listed.mcpUrl).toMatch(/\/mcp$/);
    expect(listed.tokens).toEqual([
      expect.objectContaining({ id: created.id, hint: created.hint }),
    ]);
    expect(JSON.stringify(listed)).not.toContain(created.token);
  });

  it('turns away requests without a valid token, and the app login', async () => {
    const post = (authorization?: string) =>
      fetch(mcpUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json, text/event-stream',
          ...(authorization ? { authorization } : {}),
        },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
      });
    expect((await post()).status).toBe(401);
    expect((await post('Bearer relay_nope')).status).toBe(401);
    expect((await post(`Bearer ${await tokenFor(ANA)}`)).status).toBe(401);
  });

  it('turns away pages from other sites', async () => {
    const { token } = await newToken(ANA);
    const response = await fetch(mcpUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'https://evil.example',
        authorization: `Bearer ${token}`,
      },
      body: '{}',
    });
    expect(response.status).toBe(403);
  });

  it('builds, checks and publishes a workflow, then runs it', async () => {
    const client = await connect((await newToken(ANA)).token);
    const { tools } = await client.listTools();
    expect(tools.map((tool) => tool.name).sort()).toEqual([
      'get_run',
      'get_workflow',
      'list_step_types',
      'list_workflows',
      'publish_workflow',
      'run_workflow',
      'save_workflow',
    ]);

    const types = (await call(client, 'list_step_types')).json() as unknown as {
      type: string;
    }[];
    expect(types.map((t) => t.type)).toContain('data.set');

    const draft = await call(client, 'save_workflow', {
      name: 'Greeting',
      steps: [
        { id: 'start', type: 'trigger.manual', config: {} },
        { id: 'greet', type: 'data.set', config: { fieldz: {} } },
      ],
      links: [{ from: 'start', to: 'greet' }],
    });
    const saved = draft.json() as {
      id: string;
      readyToPublish: boolean;
      issues: { code: string; message: string }[];
    };
    expect(saved.readyToPublish).toBe(false);
    expect(saved.issues.map((issue) => issue.code)).toEqual([
      'missing_config',
      'unknown_config',
    ]);

    const fixed = await call(client, 'save_workflow', {
      workflowId: saved.id,
      steps: [
        { id: 'start', type: 'trigger.manual', config: {} },
        {
          id: 'greet',
          type: 'data.set',
          config: { fields: { hello: '{{ trigger.name }}' } },
        },
      ],
      links: [{ from: 'start', to: 'greet' }],
    });
    expect(fixed.json()).toMatchObject({ id: saved.id, readyToPublish: true });

    const notYet = await call(client, 'run_workflow', { workflowId: saved.id });
    expect(notYet).toMatchObject({
      isError: true,
      text: 'Publish the workflow before running it',
    });

    expect(
      (await call(client, 'publish_workflow', { workflowId: saved.id })).json(),
    ).toEqual({ published: true, version: 1 });

    const started = (
      await call(client, 'run_workflow', {
        workflowId: saved.id,
        input: { name: 'Ana' },
      })
    ).json() as { runId: string; link: string };
    expect(started.link).toContain(`/workflows/${saved.id}/runs/`);

    const run = (
      await call(client, 'get_run', { runId: started.runId })
    ).json();
    expect(run).toMatchObject({ id: started.runId, version: 1 });
    const steps = run.steps as { id: string; output?: unknown }[];
    expect(steps.find((step) => step.id === 'start')?.output).toEqual({
      name: 'Ana',
    });

    const listed = (await call(client, 'list_workflows')).json() as unknown as {
      id: string;
      publishedVersion: number;
    }[];
    expect(listed).toEqual([
      expect.objectContaining({ id: saved.id, publishedVersion: 1 }),
    ]);
  });

  it('only shows the token owner’s workflows', async () => {
    const ana = await connect((await newToken(ANA)).token);
    const saved = (
      await call(ana, 'save_workflow', {
        name: 'Private',
        steps: [{ id: 'start', type: 'trigger.manual', config: {} }],
        links: [],
      })
    ).json() as { id: string };

    const bia = await connect((await newToken(BIA)).token);
    expect(await call(bia, 'get_workflow', { workflowId: saved.id })).toEqual(
      expect.objectContaining({
        isError: true,
        text: 'No workflow with this id',
      }),
    );
    expect((await call(bia, 'list_workflows')).json()).toEqual([]);
  });

  it('stops working once the token is revoked', async () => {
    const { id, token } = await newToken(ANA);
    await connect(token);
    const revoked = await http.call(
      `/access-tokens/${id}`,
      await tokenFor(ANA),
      {
        method: 'DELETE',
      },
    );
    expect(revoked.status).toBe(204);
    await expect(connect(token)).rejects.toThrow();
  });
});
