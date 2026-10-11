import { pgSchema } from 'drizzle-orm/pg-core';

/** Own schema, so Supabase's public REST API never exposes engine tables. */
export const relay = pgSchema('relay');
