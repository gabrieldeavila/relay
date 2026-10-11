import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { join } from 'node:path';
import postgres from 'postgres';
import { ADMIN_DATABASE_URL, TEST_DATABASE_URL } from './test-database-url';

/** Creates `relay_test` once and applies the same migrations Supabase uses. */
export default async function setupTestDatabase() {
  const admin = postgres(ADMIN_DATABASE_URL, { max: 1, onnotice: () => {} });
  const [exists] = await admin`
    SELECT 1 FROM pg_database WHERE datname = 'relay_test'`;
  if (!exists) await admin`CREATE DATABASE relay_test`;
  await admin.end();

  const client = postgres(TEST_DATABASE_URL, { max: 1, onnotice: () => {} });
  await migrate(drizzle(client), {
    migrationsFolder: join(__dirname, '../../../supabase/migrations'),
  });
  await client.end();
}
