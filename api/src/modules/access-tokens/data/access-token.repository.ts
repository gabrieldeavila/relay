import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import { DATABASE, type Database } from '../../../database/database.js';
import { accessTokens } from '../../../database/schema/index.js';
import {
  formatAccessToken,
  hashAccessToken,
  looksLikeAccessToken,
  tokenHint,
} from '../domain/access-token-format.js';

/** What the Connections page lists; never the token itself. */
export interface AccessTokenView {
  id: string;
  name: string;
  hint: string;
  lastUsedAt: Date | null;
  createdAt: Date;
}

const viewColumns = {
  id: accessTokens.id,
  name: accessTokens.name,
  hint: accessTokens.hint,
  lastUsedAt: accessTokens.lastUsedAt,
  createdAt: accessTokens.createdAt,
};

/** Only marks a token as used again after this long, to avoid a write per request. */
const TOUCH_EVERY_MS = 60_000;

@Injectable()
export class AccessTokenRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  /** The only time the token is available: the caller shows it once. */
  async create(ownerId: string, name: string) {
    const token = formatAccessToken(randomBytes(32));
    const [view] = await this.db
      .insert(accessTokens)
      .values({
        ownerId,
        name,
        tokenHash: hashAccessToken(token),
        hint: tokenHint(token),
      })
      .returning(viewColumns);
    return { ...view, token };
  }

  list(ownerId: string): Promise<AccessTokenView[]> {
    return this.db
      .select(viewColumns)
      .from(accessTokens)
      .where(eq(accessTokens.ownerId, ownerId))
      .orderBy(desc(accessTokens.createdAt));
  }

  async revoke(id: string, ownerId: string): Promise<boolean> {
    const removed = await this.db
      .delete(accessTokens)
      .where(and(eq(accessTokens.id, id), eq(accessTokens.ownerId, ownerId)))
      .returning({ id: accessTokens.id });
    return removed.length > 0;
  }

  /** The owner of a valid token, or null. */
  async ownerOf(token: string): Promise<string | null> {
    if (!looksLikeAccessToken(token)) return null;
    const [row] = await this.db
      .select({
        id: accessTokens.id,
        ownerId: accessTokens.ownerId,
        lastUsedAt: accessTokens.lastUsedAt,
      })
      .from(accessTokens)
      .where(eq(accessTokens.tokenHash, hashAccessToken(token)));
    if (!row) return null;
    const now = new Date();
    if (
      !row.lastUsedAt ||
      now.getTime() - row.lastUsedAt.getTime() > TOUCH_EVERY_MS
    ) {
      await this.db
        .update(accessTokens)
        .set({ lastUsedAt: now })
        .where(eq(accessTokens.id, row.id));
    }
    return row.ownerId;
  }
}
