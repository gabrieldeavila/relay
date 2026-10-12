import {
  BadRequestException,
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
import {
  ProviderRepository,
  type ToolProvider,
} from '../data/drizzle-provider.repository.js';
import { ToolCaller } from '../data/tool-caller.js';
import { endpointFromInput } from '../domain/endpoint-from-input.js';
import {
  describeEndpoint,
  endpointOf,
  PROVIDER_KINDS,
  type ProviderEndpoint,
} from '../domain/provider-endpoint.js';

const createBody = z.object({
  name: z.string().trim().min(1).max(60),
  /** Without a kind, a Pincel-style app (`/api/tools`) as before. */
  kind: z.enum(PROVIDER_KINDS).default('tools_api'),
  baseUrl: z.string().optional(),
  command: z.string().max(2000).optional(),
});

/** Apps whose tools become nodes ("connections" in the UI). */
@Controller('providers')
export class ProvidersController {
  constructor(
    private readonly providers: ProviderRepository,
    private readonly caller: ToolCaller,
  ) {}

  @Get()
  async list(@CurrentUser() userId: string) {
    return (await this.providers.list(userId)).map(summary);
  }

  /** Reads the app's catalog first, so a wrong address fails right away. */
  @Post()
  async create(@CurrentUser() userId: string, @Body() body: unknown) {
    const { name, ...input } = parseBody(createBody, body);
    const read = endpointFromInput(input);
    if (!read.ok) throw new BadRequestException(read.message);
    const tools = await this.readCatalog(read.endpoint);
    const provider = await this.providers.create(userId, {
      name,
      endpoint: read.endpoint,
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
    // A restarted server may have new tools: start from a fresh connection.
    await this.caller.release(id);
    const tools = await this.readCatalog(endpointOf(provider));
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
    await this.caller.release(id);
  }

  private async readCatalog(endpoint: ProviderEndpoint) {
    try {
      return await this.caller.catalog(endpoint);
    } catch (error) {
      throw new UnprocessableEntityException(
        `Could not read the tools of ${describeEndpoint(endpoint)}: ${(error as Error).message}`,
      );
    }
  }
}

function summary(provider: ToolProvider) {
  const { id, name, kind, baseUrl, refreshedAt } = provider;
  return {
    id,
    name,
    kind,
    baseUrl,
    address: describeEndpoint(endpointOf(provider)),
    toolCount: provider.tools.length,
    refreshedAt,
  };
}
