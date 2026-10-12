import {
  All,
  Controller,
  Req,
  Res,
  type OnModuleDestroy,
} from '@nestjs/common';
import {
  localhostOriginValidation,
  toNodeHandler,
  type NodeMcpRequestHandler,
} from '@modelcontextprotocol/node';
import {
  createMcpHandler,
  type AuthInfo,
  type McpHttpHandler,
} from '@modelcontextprotocol/server';
import type { Request, Response } from 'express';
import { AccessTokenRepository } from '../../access-tokens/data/access-token.repository.js';
import { Public } from '../../auth/delivery/public.decorator.js';
import { RelayMcpServer } from '../data/relay-mcp-server.js';

/**
 * Relay over MCP (Streamable HTTP) at `/mcp`. Clients sign in with a personal
 * access token (Connections page), not the app's login. Pages served from
 * other sites are turned away by their Origin.
 */
@Public()
@Controller('mcp')
export class McpController implements OnModuleDestroy {
  private readonly mcp: McpHttpHandler;
  private readonly handle: NodeMcpRequestHandler;
  private readonly sameMachineOnly = localhostOriginValidation();

  constructor(
    private readonly tokens: AccessTokenRepository,
    relay: RelayMcpServer,
  ) {
    this.mcp = createMcpHandler(({ authInfo }) =>
      relay.create(authInfo!.clientId),
    );
    this.handle = toNodeHandler(this.mcp);
  }

  @All()
  async serve(@Req() req: Request, @Res() res: Response) {
    if (!this.sameMachineOnly(req, res)) return;
    const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    const ownerId = token ? await this.tokens.ownerOf(token) : null;
    if (!token || !ownerId) {
      res.status(401).set('WWW-Authenticate', 'Bearer realm="relay"').json({
        error:
          'Use a personal access token from Relay (Connections → Use Relay from Claude)',
      });
      return;
    }
    const auth: AuthInfo = { token, clientId: ownerId, scopes: [] };
    Object.assign(req, { auth });
    await this.handle(req, res, req.body);
  }

  onModuleDestroy() {
    return this.mcp.close();
  }
}
