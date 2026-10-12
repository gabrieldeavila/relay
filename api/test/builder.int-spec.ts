import { sql } from 'drizzle-orm';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DATABASE, type Database } from '../src/database/database';
import { startHttpApp, tokenFor } from './support/http-harness';
import { TestServer } from './support/test-server';

const ANA = '00000000-0000-4000-8000-00000000000a';

const answer = (json: unknown) => ({
  status: 200,
  body: {
    id: 'msg_1',
    type: 'message',
    role: 'assistant',
    model: 'claude-opus-5-5',
    content: [{ type: 'text', text: JSON.stringify(json) }],
    stop_reason: 'end_turn',
    usage: { input_tokens: 100, output_tokens: 50 },
  },
});

const flow = (sendPort: string) => ({
  name: 'Approve, then tell me',
  summary: 'Asks you, then sends a Telegram message. Fill in the chat.',
  steps: [
    { id: 'start', type: 'trigger.manual', configJson: '{}' },
    {
      id: 'ask',
      type: 'flow.approval',
      configJson: JSON.stringify({ question: 'Send it?' }),
    },
    {
      id: 'tell',
      type: 'telegram.send',
      configJson: JSON.stringify({ text: 'Approved: {{ run.link }}' }),
    },
  ],
  links: [
    { from: 'start', to: 'ask', port: 'out' },
    { from: 'ask', to: 'tell', port: sendPort },
  ],
});

describe('describe what you want', () => {
  let http: Awaited<ReturnType<typeof startHttpApp>>;
  let token: string;
  const anthropic = new TestServer();

  beforeAll(async () => {
    process.env.SECRET_KEY_FILE = join(
      tmpdir(),
      `relay-test-key-${process.pid}`,
    );
    await anthropic.start();
    process.env.ANTHROPIC_BASE_URL = anthropic.url('').replace(/\/$/, '');
    http = await startHttpApp();
    token = await tokenFor(ANA);
  });
  afterAll(async () => {
    await anthropic.stop();
    await http.app.close();
  });
  beforeEach(async () => {
    await http.app
      .get<Database>(DATABASE)
      .execute(sql`DELETE FROM relay.accounts`);
  });

  const build = (description: string) =>
    http.call('/workflows/build', token, {
      method: 'POST',
      body: JSON.stringify({ description }),
    });
  const saveKey = () =>
    http.call('/accounts/ai', token, {
      method: 'PUT',
      body: JSON.stringify({ settings: {}, secret: 'sk-test' }),
    });

  it('asks for an API key first', async () => {
    const response = await build('Tell me when something is approved');
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      message: 'Set up an Anthropic API key in Connections first',
    });
  });

  it('sends problems back to Claude and saves the corrected draft', async () => {
    expect((await saveKey()).status).toBe(200);
    anthropic.reply(answer(flow('yes')), answer(flow('approved')));

    const response = await build('Ask me, then message me on Telegram');
    expect(response.status).toBe(201);
    const built = (await response.json()) as {
      id: string;
      name: string;
      issues: { code: string; nodeId: string; message: string }[];
    };
    expect(built).toMatchObject({ name: 'Approve, then tell me', issues: [] });

    const [first, second] = anthropic.received;
    expect(first.headers['x-api-key']).toBe('sk-test');
    expect(first.body).toMatchObject({
      model: 'claude-opus-5-5',
      output_config: { format: { type: 'json_schema' } },
      messages: [{ role: 'user' }],
    });
    const followUp = (second.body as { messages: { content: unknown }[] })
      .messages;
    expect(followUp).toHaveLength(3);
    expect(JSON.stringify(followUp[2].content)).toContain(
      'leaves through \\"yes\\"',
    );

    const workflow = (await (
      await http.call(`/workflows/${built.id}`, token)
    ).json()) as {
      latestVersion: number | null;
      draftGraph: { nodes: { id: string; position: { x: number } }[] };
    };
    expect(workflow.latestVersion).toBeNull();
    expect(workflow.draftGraph.nodes.map((n) => [n.id, n.position.x])).toEqual([
      ['start', 0],
      ['ask', 300],
      ['tell', 600],
    ]);
  });

  it('explains when Claude cannot produce a usable flow', async () => {
    await saveKey();
    anthropic.reply({
      ...answer({}),
      body: { ...answer({}).body, content: [{ type: 'text', text: 'nope' }] },
    });
    const response = await build('Something impossible');
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({
      problems: ['The answer was not valid JSON.'],
    });
    expect(anthropic.received).toHaveLength(3);
  });
});
