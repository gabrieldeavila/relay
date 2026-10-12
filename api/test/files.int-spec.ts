import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { RunFileStore } from '../src/modules/files/data/run-file-store';
import { startHttpApp, tokenFor } from './support/http-harness';

const ANA = '00000000-0000-4000-8000-00000000000a';
const BIA = '00000000-0000-4000-8000-00000000000b';

describe('run files over HTTP', () => {
  let http: Awaited<ReturnType<typeof startHttpApp>>;

  beforeAll(async () => {
    // Inside a dot folder, like the default `.data/files`.
    process.env.FILES_DIR = join(
      tmpdir(),
      `relay-${process.pid}`,
      '.data',
      'files',
    );
    http = await startHttpApp();
  });
  afterAll(() => http.app.close());

  it('serves a run’s file to its owner only', async () => {
    const ana = await tokenFor(ANA);
    const post = async (path: string, body: unknown = {}) =>
      (
        await http.call(path, ana, {
          method: 'POST',
          body: JSON.stringify(body),
        })
      ).json() as Promise<{ id: string }>;
    const { id } = await post('/workflows', { name: 'Files' });
    await http.call(`/workflows/${id}`, ana, {
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
    await post(`/workflows/${id}/publish`);
    const run = await post(`/workflows/${id}/runs`);
    const bytes = Buffer.from('png-bytes');
    const file = await http.app
      .get(RunFileStore)
      .save(run.id, { nodeId: 'render', attempt: 1 }, bytes, 'image/png');
    const path = new URL(file.url).pathname;

    const own = await http.call(path, ana);
    expect(own.status).toBe(200);
    expect(own.headers.get('content-type')).toBe('image/png');
    expect(Buffer.from(await own.arrayBuffer())).toEqual(bytes);
    expect((await http.call(path, await tokenFor(BIA))).status).toBe(404);
    expect((await http.call(path)).status).toBe(401);
    expect(
      (await http.call(`/files/${run.id}/..%2F..%2Fsecret.png`, ana)).status,
    ).toBe(404);
  });
});
