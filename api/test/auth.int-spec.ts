import { SignJWT } from 'jose';
import { startHttpApp, tokenFor } from './support/http-harness';

const ANA = '00000000-0000-4000-8000-00000000000a';
const BIA = '00000000-0000-4000-8000-00000000000b';

describe('auth over HTTP', () => {
  let http: Awaited<ReturnType<typeof startHttpApp>>;
  const call = (...args: Parameters<typeof http.call>) => http.call(...args);

  beforeAll(async () => {
    http = await startHttpApp();
  });
  afterAll(() => http.app.close());

  it('needs a login for the API but not for health, hooks or resume links', async () => {
    expect((await call('/workflows')).status).toBe(401);
    expect((await call('/health')).status).toBe(200);
    expect(
      (await call('/hooks/nope', undefined, { method: 'POST' })).status,
    ).toBe(404);
    expect(
      (await call('/resume/nope/ask', undefined, { method: 'POST' })).status,
    ).toBe(404);
  });

  it('rejects forged, expired and anonymous tokens', async () => {
    const forged = await new SignJWT({ role: 'authenticated' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(ANA)
      .setExpirationTime('1h')
      .sign(
        new TextEncoder().encode('another-secret-another-secret-another!!'),
      );
    expect((await call('/workflows', forged)).status).toBe(401);
    expect(
      (await call('/workflows', await tokenFor(ANA, 'authenticated', '-1m')))
        .status,
    ).toBe(401);
    expect((await call('/workflows', await tokenFor(ANA, 'anon'))).status).toBe(
      401,
    );
  });

  it('shows each person only their own workflows', async () => {
    const ana = await tokenFor(ANA);
    const bia = await tokenFor(BIA);
    const created = await call('/workflows', ana, {
      method: 'POST',
      body: JSON.stringify({ name: 'Weekly post' }),
    });
    expect(created.status).toBe(201);
    const { id } = (await created.json()) as { id: string };

    expect(
      ((await (await call('/workflows', ana)).json()) as unknown[]).length,
    ).toBe(1);
    expect(await (await call('/workflows', bia)).json()).toEqual([]);
    expect((await call(`/workflows/${id}`, bia)).status).toBe(404);
    expect(
      (await call(`/workflows/${id}/publish`, bia, { method: 'POST' })).status,
    ).toBe(404);
    expect(
      (await call(`/workflows/${id}/runs`, bia, { method: 'POST' })).status,
    ).toBe(404);
    expect((await call(`/workflows/${id}/trigger`, bia)).status).toBe(200);
  });
});
