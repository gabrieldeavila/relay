import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { sql } from 'drizzle-orm';
import { SignJWT } from 'jose';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { AppModule } from '../src/app.module';
import { DATABASE, type Database } from '../src/database/database';
import { TEST_DATABASE_URL } from './support/test-database-url';

const SECRET = 'test-secret-with-at-least-32-characters!!';
const ANA = '00000000-0000-4000-8000-00000000000a';
const BIA = '00000000-0000-4000-8000-00000000000b';

const tokenFor = (sub: string, role = 'authenticated', expiresIn = '1h') =>
  new SignJWT({ role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(sub)
    .setExpirationTime(expiresIn)
    .sign(new TextEncoder().encode(SECRET));

describe('auth over HTTP', () => {
  let app: INestApplication;
  let base: string;

  const call = (path: string, token?: string, init: RequestInit = {}) =>
    fetch(`${base}${path}`, {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    });

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    process.env.WORKER_ENABLED = 'false';
    process.env.SUPABASE_JWT_SECRET = SECRET;
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    await app.listen(0, '127.0.0.1');
    base = `http://127.0.0.1:${((app.getHttpServer() as Server).address() as AddressInfo).port}`;
    await app.get<Database>(DATABASE).execute(sql`DELETE FROM relay.workflows`);
  });
  afterAll(() => app.close());

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
