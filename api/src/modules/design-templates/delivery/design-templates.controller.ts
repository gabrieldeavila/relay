import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { orNotFound } from '../../../http/or-not-found.js';
import { DesignTemplates } from '../data/design-templates.service.js';
import { galleryEntry } from '../domain/gallery-entry.js';

/** The template gallery in the UI: list, previews, and "use this template". */
@Controller('design-templates')
export class DesignTemplatesController {
  constructor(private readonly templates: DesignTemplates) {}

  @Get()
  async list() {
    return (await this.templates.registry.list()).map(galleryEntry);
  }

  @Get(':name/preview.png')
  async preview(
    @Param('name') name: string,
    @Query('maxSize') maxSize: string | undefined,
    @Res() res: Response,
  ) {
    const png = await orNotFound(
      this.templates.preview(name, Number(maxSize) || 480),
    );
    res.type('png').set('cache-control', 'no-store').send(png);
  }

  /** Creates an image from the template with its default texts and returns its id. */
  @Post(':name/use')
  async use(
    @Param('name') name: string,
    @Body() body: { fields?: Record<string, string> } | undefined,
  ) {
    const created = await orNotFound(
      this.templates.create({
        template: name,
        fields: body?.fields ?? {},
        source: 'ui',
      }),
    );
    return { imageId: created.id };
  }
}
