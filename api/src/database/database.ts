import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from './schema/index.js';

export type Database = PostgresJsDatabase<typeof schema>;

/** Injection token for the Drizzle instance. */
export const DATABASE = 'DATABASE';

export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];
