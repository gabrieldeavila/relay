import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  UnprocessableEntityException,
} from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser } from '../../auth/delivery/current-user.decorator.js';
import { parseBody } from '../../workflows/delivery/workflow-bodies.js';
import { ProviderRepository } from '../data/drizzle-provider.repository.js';
import { ToolProviderClient } from '../data/tool-provider.client.js';

const createBody = z.object({
  name: z.string().trim().min(1).max(60),
  baseUrl: z.url().transform((url) => url.replace(/\/+$/, '')),
});

/** Apps whose tools become nodes ("connections" in the UI). */
@Controller('providers')
export class ProvidersController {
  constructor(
    private readonly providers: ProviderRepository,
    private readonly client: ToolProviderClient,
  ) {}

  @Get()
  async list(@CurrentUser() userId: string) {
    return (await this.providers.list(userId)).map(summary);
  }

  /** Reads the app's catalog first, so a wrong address fails right away. */
  @Post()
  async create(@CurrentUser() userId: string, @Body() body: unknown) {
    const { name, baseUrl } = parseBody(createBody, body);
    const tools = await this.readCatalog(baseUrl);
    const provider = await this.providers.create(userId, {
      name,
      baseUrl,
      tools,
    });
    if (!provider) throw new ConflictException('This app is already connected');
    return summary(provider);
  }

  @Post(':id/refresh')
  async refresh(
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const provider = await this.providers.find(id, userId);
    if (!provider) throw new NotFoundException('Connection not found');
    const tools = await this.readCatalog(provider.baseUrl);
    const updated = await this.providers.updateTools(id, userId, tools);
    // Removed while its catalog was being read.
    if (!updated) throw new NotFoundException('Connection not found');
    return summary(updated);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (!(await this.providers.remove(id, userId))) {
      throw new NotFoundException('Connection not found');
    }
  }

  private async readCatalog(baseUrl: string) {
    try {
      return await this.client.catalog(baseUrl);
    } catch (error) {
      throw new UnprocessableEntityException(
        `Could not read the tools of ${baseUrl}: ${(error as Error).message}`,
      );
    }
  }
}

function summary(provider: {
  id: string;
  name: string;
  baseUrl: string;
  tools: unknown[];
  refreshedAt: Date;
}) {
  const { id, name, baseUrl, refreshedAt } = provider;
  return { id, name, baseUrl, toolCount: provider.tools.length, refreshedAt };
}
