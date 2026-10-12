import { Global, Inject, Module, type OnModuleDestroy } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { DATABASE } from './database.js';
import * as schema from './schema/index.js';

/** Raw postgres.js client, for LISTEN/NOTIFY. */
export const SQL_CLIENT = 'SQL_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: SQL_CLIENT,
      useFactory: () => postgres(databaseUrl(), { max: 10 }),
    },
    {
      provide: DATABASE,
      inject: [SQL_CLIENT],
      useFactory: (client: postgres.Sql) => drizzle(client, { schema }),
    },
  ],
  exports: [DATABASE, SQL_CLIENT],
})
export class DatabaseModule implements OnModuleDestroy {
  constructor(@Inject(SQL_CLIENT) private readonly client: postgres.Sql) {}

  async onModuleDestroy() {
    await this.client.end({ timeout: 5 });
  }
}

function databaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set (see api/.env.example)');
  return url;
}
