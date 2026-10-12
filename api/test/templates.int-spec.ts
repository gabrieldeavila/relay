import { sql } from 'drizzle-orm';
import { DATABASE, type Database } from '../src/database/database';
import { FakeToolApp } from './support/fake-tool-app';
import { startHttpApp, tokenFor } from './support/http-harness';

const ANA = '00000000-0000-4000-8000-00000000000a';
const object = { type: 'object', properties: {} };

describe('templates over HTTP', () => {
  let http: Awaited<ReturnType<typeof startHttpApp>>;
  let token: string;
  const pincel = new FakeToolApp(
    ['create_document', 'draw_text', 'render_image'].map((name) => ({
      name,
      input_schema: object,
    })),
    {},
  );
  const json = (body: unknown): RequestInit => ({
    method: 'POST',
    body: JSON.stringify(body),
  });

  beforeAll(async () => {
    http = await startHttpApp();
    token = await tokenFor(ANA);
    await pincel.start();
  });
  afterAll(async () => {
    await pincel.stop();
    await http.app.close();
  });
  beforeEach(async () => {
    const db = http.app.get<Database>(DATABASE);
    await db.execute(sql`DELETE FROM relay.tool_providers`);
    await db.execute(sql`DELETE FROM relay.accounts`);
  });

  it('lists templates with what each one still needs', async () => {
    const templates = (await (await http.call('/templates', token)).json()) as {
      id: string;
      canUse: boolean;
      needs: { key: string; ready: boolean }[];
    }[];
    expect(templates.map((t) => t.id)).toEqual([
      'quote-of-the-week',
      'folder-to-email',
      'weekly-sheet-summary',
    ]);
    const quote = templates[0];
    expect(quote.canUse).toBe(false);
    expect(quote.needs).toEqual([
      { kind: 'app', key: 'pincel', name: 'Pincel', ready: false },
      { kind: 'account', key: 'telegram', ready: false },
    ]);
    expect(templates[1].canUse).toBe(true);
  });

  it('asks to connect Pincel before using a template that draws', async () => {
    const response = await http.call(
      '/templates/quote-of-the-week/use',
      token,
      json({}),
    );
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      message: 'Connect Pincel first (see Connections)',
    });
  });

  it('creates a draft whose publish points at the blanks to fill', async () => {
    await http.call(
      '/providers',
      token,
      json({ name: 'Pincel', baseUrl: pincel.url }),
    );
    const created = await http.call(
      '/templates/quote-of-the-week/use',
      token,
      json({ name: 'Citação da semana' }),
    );
    expect(created.status).toBe(201);
    const { id } = (await created.json()) as { id: string };

    const workflow = (await (
      await http.call(`/workflows/${id}`, token)
    ).json()) as {
      name: string;
      draftGraph: { nodes: { id: string; type: string }[] };
    };
    expect(workflow.name).toBe('Citação da semana');
    expect(
      workflow.draftGraph.nodes.find((n) => n.id === 'render')?.type,
    ).toMatch(/^tool:[0-9a-f-]{36}:render_image$/);

    const publish = await http.call(`/workflows/${id}/publish`, token, {
      method: 'POST',
    });
    expect(publish.status).toBe(422);
    expect(await publish.json()).toMatchObject({
      issues: [{ code: 'missing_config', nodeId: 'quotes', field: 'path' }],
    });
  });

  it('answers 404 for an unknown template', async () => {
    expect(
      (await http.call('/templates/nope/use', token, json({}))).status,
    ).toBe(404);
  });
});
