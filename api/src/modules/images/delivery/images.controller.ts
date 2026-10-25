import { Controller, Get, Param, Query, Res, Sse } from '@nestjs/common';
import type { Response } from 'express';
import { Observable } from 'rxjs';
import { renderPng } from '../data/document-renderer.js';
import { orNotFound } from '../../../http/or-not-found.js';
import { ImageDocuments } from '../data/image-documents.js';
import { describeDocument } from './tools/describe-document.js';

/** Read-only views of image documents for the UI; editing happens over MCP. */
@Controller('images')
export class ImagesController {
  constructor(private readonly documents: ImageDocuments) {}

  @Get()
  list() {
    return this.documents.list();
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const engine = await orNotFound(this.documents.engine(id));
    return {
      id,
      name: await this.documents.nameOf(id),
      ...describeDocument(engine),
    };
  }

  @Get(':id/render.png')
  async render(
    @Param('id') id: string,
    @Query('maxSize') maxSize: string | undefined,
    @Res() res: Response,
  ) {
    const engine = await orNotFound(this.documents.engine(id));
    const png = renderPng(engine.doc, { maxSize: Number(maxSize) || 1600 });
    res.type('png').set('cache-control', 'no-store').send(png);
  }

  /** `{ version }` every time the document changes. */
  @Sse(':id/events')
  events(@Param('id') id: string) {
    return new Observable<{ data: { version: number } }>((subscriber) => {
      let unsubscribe = () => {};
      orNotFound(this.documents.engine(id)).then(
        (engine) => {
          unsubscribe = engine.changes.subscribe(({ version }) =>
            subscriber.next({ data: { version } }),
          );
        },
        (error: unknown) => subscriber.error(error),
      );
      return () => unsubscribe();
    });
  }
}
