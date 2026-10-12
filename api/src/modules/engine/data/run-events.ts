import {
  Inject,
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { sql } from 'drizzle-orm';
import type postgres from 'postgres';
import { filter, Subject, type Observable } from 'rxjs';
import { SQL_CLIENT } from '../../../database/database.module.js';
import type { Database, Transaction } from '../../../database/database.js';

const CHANNEL = 'relay_runs';

/**
 * "This run changed" signals through Postgres NOTIFY, so a worker in any
 * process wakes up the screens watching the run. Sent inside a transaction,
 * a notification is delivered only if it commits.
 */
@Injectable()
export class RunEvents implements OnModuleInit, OnModuleDestroy {
  private readonly changed = new Subject<string>();
  private listener?: postgres.ListenMeta;

  constructor(@Inject(SQL_CLIENT) private readonly client: postgres.Sql) {}

  async onModuleInit() {
    this.listener = await this.client.listen(CHANNEL, (runId) =>
      this.changed.next(runId),
    );
  }

  async onModuleDestroy() {
    await this.listener?.unlisten();
  }

  changes(runId: string): Observable<string> {
    return this.changed.pipe(filter((id) => id === runId));
  }

  async notify(db: Database | Transaction, runIds: Iterable<string>) {
    for (const runId of new Set(runIds)) {
      await db.execute(sql`SELECT pg_notify(${CHANNEL}, ${runId})`);
    }
  }
}
