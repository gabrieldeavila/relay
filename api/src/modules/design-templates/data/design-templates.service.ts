import { Injectable } from '@nestjs/common';
import { resolve } from 'node:path';
import { createNamedJsonStore } from '../../../named-json-store.js';
import { renderPng } from '../../images/data/document-renderer.js';
import { ImageDocuments } from '../../images/data/image-documents.js';
import type { CommandSource } from '../../images/data/logged-command.js';
import type { DesignTemplate, FieldValues } from '../domain/design-template.js';
import { createDesignTemplateRegistry } from './design-template-registry.js';
import { designSetup, drawDesign, drawPreview } from './draw-design.js';

export interface CreateDesignRequest {
  template: string;
  fields: FieldValues;
  /** Document name; defaults to the template's. */
  name?: string;
  source: CommandSource;
}

/** Design templates: listing, previews, and new image documents made from them. */
@Injectable()
export class DesignTemplates {
  readonly registry = createDesignTemplateRegistry(
    createNamedJsonStore<DesignTemplate>(
      resolve(
        process.env.DESIGN_TEMPLATES_FILE ?? '.data/design-templates.json',
      ),
    ),
  );
  /** Rendered with defaults, keyed by the template's content so edits redraw. */
  private readonly previews = new Map<string, Promise<Buffer>>();

  constructor(private readonly documents: ImageDocuments) {}

  async preview(name: string, maxSize: number): Promise<Buffer> {
    const template = await this.registry.get(name);
    const key = `${maxSize}:${JSON.stringify(template)}`;
    const cached = this.previews.get(key);
    if (cached) return cached;
    const rendering = this.renderPreview(template, maxSize);
    rendering.catch(() => this.previews.delete(key));
    this.previews.set(key, rendering);
    return rendering;
  }

  async create(request: CreateDesignRequest) {
    const template = await this.registry.get(request.template);
    const created = await this.documents.create(
      request.name ?? template.name,
      designSetup(template),
      request.source,
    );
    const { missingFonts } = await drawDesign(template, request.fields, {
      engine: created.engine,
      fonts: this.documents.fonts,
      assets: this.documents.assets,
      source: request.source,
    });
    return { id: created.id, engine: created.engine, template, missingFonts };
  }

  private async renderPreview(template: DesignTemplate, maxSize: number) {
    const engine = this.documents.scratchEngine();
    await drawPreview(engine, template, {
      fonts: this.documents.fonts,
      assets: this.documents.assets,
    });
    return renderPng(engine.doc, { maxSize });
  }
}
