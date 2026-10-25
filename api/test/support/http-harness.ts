import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { sql } from 'drizzle-orm';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { AppModule } from '../../src/app.module';
import { DATABASE, type Database } from '../../src/database/database';
import { TEST_DATABASE_URL } from './test-database-url';

/** The real app over HTTP on a random port, against `relay_test`, starting empty. */
export async function startHttpApp() {
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  const module = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app: INestApplication = module.createNestApplication();
  await app.listen(0, '127.0.0.1');
  const { port } = (app.getHttpServer() as Server).address() as AddressInfo;
  await app
    .get<Database>(DATABASE)
    .execute(
      sql`TRUNCATE relay.video_exports, relay.video_projects, relay.image_documents, relay.assets`,
    );

  const baseUrl = `http://127.0.0.1:${port}`;
  const call = (path: string, init: RequestInit = {}) =>
    fetch(`${baseUrl}${path}`, {
      ...init,
      headers: { 'content-type': 'application/json' },
    });
  return { app, call, baseUrl };
}
