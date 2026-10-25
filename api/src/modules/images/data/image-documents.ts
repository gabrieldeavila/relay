import { Injectable, type OnModuleInit } from '@nestjs/common';
import { resolve } from 'node:path';
import { AssetStore } from '../../assets/data/asset-store.js';
import { isUuid } from '../../../is-uuid.js';
import { emptyHistory } from '../../history/domain/history.js';
import type { DocumentSetup } from '../domain/document/types.js';
import type { PaintEnv } from '../domain/paint/surface.js';
import { DocumentEngine } from './document-engine.js';
import { createFontStore } from './font-store.js';
import { ImageDocumentsRepository } from './image-documents.repository.js';
import type { CommandSource } from './logged-command.js';
import { createPaintEnv } from './napi-paint-env.js';

/** Engines kept in memory; older ones are dropped and rebuilt by replay when needed. */
const MAX_OPEN = 8;

/** Every image document, each edited through its own engine. */
@Injectable()
export class ImageDocuments implements OnModuleInit {
  readonly fonts = createFontStore(
    resolve(process.env.FONTS_DIR ?? '.data/fonts'),
  );
  private readonly env: PaintEnv;
  private readonly engines = new Map<string, Promise<DocumentEngine>>();

  constructor(
    private readonly repository: ImageDocumentsRepository,
    readonly assets: AssetStore,
  ) {
    this.env = createPaintEnv(async (id) => (await assets.get(id)).path);
  }

  async onModuleInit() {
    await this.fonts.registerSaved();
  }

  async create(name: string, setup: DocumentSetup, source: CommandSource) {
    const row = await this.repository.create(name, {
      setup,
      history: emptyHistory(),
    });
    const engine = this.newEngine(row.id);
    await engine.reset(setup, source);
    this.remember(row.id, Promise.resolve(engine));
    return { id: row.id, engine };
  }

  /** The engine of a document, loading it from the database when needed. */
  engine(id: string): Promise<DocumentEngine> {
    const open = this.engines.get(id);
    if (open) {
      this.remember(id, open);
      return open;
    }
    const loading = this.load(id);
    loading.catch(() => this.engines.delete(id));
    this.remember(id, loading);
    return loading;
  }

  list() {
    return this.repository.list();
  }

  async nameOf(id: string) {
    return (await this.repository.find(id))?.name ?? null;
  }

  private async load(id: string) {
    const row = isUuid(id) ? await this.repository.find(id) : null;
    if (!row) throw new Error(`No image with id ${id}. Use list_images.`);
    const engine = this.newEngine(id);
    await engine.load({ setup: row.setup, history: row.history });
    return engine;
  }

  private newEngine(id: string) {
    return new DocumentEngine(this.env, {
      save: (doc) => this.repository.save(id, doc),
    });
  }

  /** Most recently used last, so the first entry is the one to drop. */
  private remember(id: string, engine: Promise<DocumentEngine>) {
    this.engines.delete(id);
    this.engines.set(id, engine);
    const [oldest] = this.engines.keys();
    if (this.engines.size > MAX_OPEN) this.engines.delete(oldest);
  }
}
