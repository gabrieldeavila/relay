import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/database/schema/index.ts',
  // Supabase applies these on `supabase db reset` / `supabase migration up`.
  out: '../supabase/migrations',
  migrations: { prefix: 'supabase' },
  schemaFilter: ['relay'],
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
  },
});
