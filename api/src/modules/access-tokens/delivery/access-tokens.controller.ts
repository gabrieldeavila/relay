import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { z } from 'zod';
import { publicUrl } from '../../../public-url.js';
import { CurrentUser } from '../../auth/delivery/current-user.decorator.js';
import { parseBody } from '../../workflows/delivery/workflow-bodies.js';
import { AccessTokenRepository } from '../data/access-token.repository.js';

const createBody = z.object({
  name: z.string().trim().min(1).max(60).default('Claude'),
});

/** Tokens for using Relay from other apps over MCP (`/mcp`). */
@Controller('access-tokens')
export class AccessTokensController {
  constructor(private readonly tokens: AccessTokenRepository) {}

  @Get()
  async list(@CurrentUser() userId: string) {
    return {
      mcpUrl: `${publicUrl()}/mcp`,
      tokens: await this.tokens.list(userId),
    };
  }

  /** Answers the token once; only its hash is kept. */
  @Post()
  async create(@CurrentUser() userId: string, @Body() body: unknown) {
    const { name } = parseBody(createBody, body ?? {});
    return this.tokens.create(userId, name);
  }

  @Delete(':id')
  @HttpCode(204)
  async revoke(
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (!(await this.tokens.revoke(id, userId))) {
      throw new NotFoundException('Token not found');
    }
  }
}
