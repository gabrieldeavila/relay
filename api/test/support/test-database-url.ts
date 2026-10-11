/** Separate database in the local Supabase Postgres, so tests never wipe dev data. */
export const ADMIN_DATABASE_URL =
  'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
export const TEST_DATABASE_URL =
  'postgresql://postgres:postgres@127.0.0.1:54322/relay_test';
