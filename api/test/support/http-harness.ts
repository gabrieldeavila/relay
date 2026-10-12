import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { sql } from 'drizzle-orm';
import { SignJWT } from 'jose';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { AppModule } from '../../src/app.module';
import { DATABASE, type Database } from '../../src/database/database';
import { TEST_DATABASE_URL } from './test-database-url';

export const TEST_JWT_SECRET = 'test-secret-with-at-least-32-characters!!';

export const tokenFor = (
  sub: string,
  role = 'authenticated',
  expiresIn = '1h',
) =>
  new SignJWT({ role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(sub)
    .setExpirationTime(expiresIn)
    .sign(new TextEncoder().encode(TEST_JWT_SECRET));

/** The real app over HTTP on a random port, against `relay_test`, worker off. */
export async function startHttpApp() {
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  process.env.WORKER_ENABLED = 'false';
  process.env.SUPABASE_JWT_SECRET = TEST_JWT_SECRET;
  const module = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app: INestApplication = module.createNestApplication();
  await app.listen(0, '127.0.0.1');
  const { port } = (app.getHttpServer() as Server).address() as AddressInfo;
  await app.get<Database>(DATABASE).execute(sql`DELETE FROM relay.workflows`);

  const call = (path: string, token?: string, init: RequestInit = {}) =>
    fetch(`http://127.0.0.1:${port}${path}`, {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    });
  return { app, call };
}
