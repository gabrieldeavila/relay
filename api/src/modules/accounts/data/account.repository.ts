import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DATABASE, type Database } from '../../../database/database.js';
import { accounts } from '../../../database/schema/index.js';
import { accountMissing } from '../domain/account-missing.js';
import {
  ACCOUNT_SETTINGS,
  type AccountCredentials,
  type AccountKind,
  type AccountSettings,
} from '../domain/account-kinds.js';
import { SecretBox } from './secret-box.js';

/** What the UI sees: never the secret itself. */
export interface AccountView {
  kind: AccountKind;
  settings: Record<string, unknown>;
  updatedAt: Date;
}

/** Accounts, always scoped to their owner; secrets sealed at rest. */
@Injectable()
export class AccountRepository {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly box: SecretBox,
  ) {}

  list(ownerId: string): Promise<AccountView[]> {
    return this.db
      .select({
        kind: accounts.kind,
        settings: accounts.settings,
        updatedAt: accounts.updatedAt,
      })
      .from(accounts)
      .where(eq(accounts.ownerId, ownerId));
  }

  async find<K extends AccountKind>(
    ownerId: string,
    kind: K,
  ): Promise<AccountCredentials<K> | null> {
    const [row] = await this.db
      .select()
      .from(accounts)
      .where(owned(ownerId, kind));
    if (!row) return null;
    return {
      settings: ACCOUNT_SETTINGS[kind].parse(
        row.settings,
      ) as AccountSettings[K],
      secret: this.box.open(row.secret),
    };
  }

  /** For steps: a missing account fails the step with a readable message. */
  async require<K extends AccountKind>(
    ownerId: string,
    kind: K,
  ): Promise<AccountCredentials<K>> {
    const account = await this.find(ownerId, kind);
    if (!account) throw accountMissing(kind);
    return account;
  }

  /**
   * Without a new secret the stored one is kept (editing the server name
   * should not ask for the password again). Null when there is none to keep.
   */
  async save(
    ownerId: string,
    kind: AccountKind,
    settings: Record<string, unknown>,
    secret: string | undefined,
  ): Promise<AccountView | null> {
    const sealed =
      secret === undefined ? await this.sealedSecret(ownerId, kind) : null;
    const value = secret === undefined ? sealed : this.box.seal(secret);
    if (!value) return null;
    const columns = { settings, secret: value, updatedAt: new Date() };
    const [row] = await this.db
      .insert(accounts)
      .values({ ownerId, kind, ...columns })
      .onConflictDoUpdate({
        target: [accounts.ownerId, accounts.kind],
        set: columns,
      })
      .returning();
    return { kind: row.kind, settings: row.settings, updatedAt: row.updatedAt };
  }

  async remove(ownerId: string, kind: AccountKind): Promise<boolean> {
    const removed = await this.db
      .delete(accounts)
      .where(owned(ownerId, kind))
      .returning({ kind: accounts.kind });
    return removed.length > 0;
  }

  private async sealedSecret(ownerId: string, kind: AccountKind) {
    const [row] = await this.db
      .select({ secret: accounts.secret })
      .from(accounts)
      .where(owned(ownerId, kind));
    return row?.secret ?? null;
  }
}

const owned = (ownerId: string, kind: AccountKind) =>
  and(eq(accounts.ownerId, ownerId), eq(accounts.kind, kind));
