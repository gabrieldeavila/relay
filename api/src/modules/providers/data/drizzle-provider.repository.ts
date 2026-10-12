import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { DATABASE, type Database } from '../../../database/database.js';
import { toolProviders } from '../../../database/schema/index.js';
import type { ToolDescriptor } from '../domain/tool-catalog.js';

export type ToolProvider = typeof toolProviders.$inferSelect;

/** Tool providers, always scoped to their owner. */
@Injectable()
export class ProviderRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async create(
    ownerId: string,
    provider: { name: string; baseUrl: string; tools: ToolDescriptor[] },
  ): Promise<ToolProvider | null> {
    const [row] = await this.db
      .insert(toolProviders)
      .values({ ownerId, ...provider })
      .onConflictDoNothing()
      .returning();
    return row ?? null;
  }

  list(ownerId: string): Promise<ToolProvider[]> {
    return this.db
      .select()
      .from(toolProviders)
      .where(eq(toolProviders.ownerId, ownerId))
      .orderBy(asc(toolProviders.name));
  }

  async find(id: string, ownerId: string): Promise<ToolProvider | null> {
    const [row] = await this.db
      .select()
      .from(toolProviders)
      .where(owned(id, ownerId));
    return row ?? null;
  }

  async updateTools(
    id: string,
    ownerId: string,
    tools: ToolDescriptor[],
  ): Promise<ToolProvider | null> {
    const [row] = await this.db
      .update(toolProviders)
      .set({ tools, refreshedAt: new Date() })
      .where(owned(id, ownerId))
      .returning();
    return row ?? null;
  }

  async remove(id: string, ownerId: string): Promise<boolean> {
    const removed = await this.db
      .delete(toolProviders)
      .where(owned(id, ownerId))
      .returning({ id: toolProviders.id });
    return removed.length > 0;
  }
}

const owned = (id: string, ownerId: string) =>
  and(eq(toolProviders.id, id), eq(toolProviders.ownerId, ownerId));
