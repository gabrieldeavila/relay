import { Inject, Injectable } from '@nestjs/common';
import { desc, eq, inArray } from 'drizzle-orm';
import { DATABASE, type Database } from '../../../database/database.js';
import { assets } from '../../../database/schema/index.js';
import type { Asset, AssetKind } from '../domain/asset.js';

export type NewAsset = Omit<Asset, 'createdAt'>;

@Injectable()
export class AssetRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async insert(asset: NewAsset): Promise<Asset> {
    const [row] = await this.db.insert(assets).values(asset).returning();
    return row;
  }

  async find(id: string): Promise<Asset | null> {
    const [row] = await this.db.select().from(assets).where(eq(assets.id, id));
    return row ?? null;
  }

  findMany(ids: string[]): Promise<Asset[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.db.select().from(assets).where(inArray(assets.id, ids));
  }

  list(kind?: AssetKind, limit = 50): Promise<Asset[]> {
    return this.db
      .select()
      .from(assets)
      .where(kind ? eq(assets.kind, kind) : undefined)
      .orderBy(desc(assets.createdAt))
      .limit(limit);
  }
}
