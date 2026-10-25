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
  type McpHttpHandler,
} from '@modelcontextprotocol/server';
import type { Request, Response } from 'express';
import { RelayMcpServer } from '../data/relay-mcp-server.js';

/**
 * Relay over MCP (Streamable HTTP) at `/mcp`. Local only: the API listens on
 * 127.0.0.1, and pages served from other sites are turned away by their Origin.
 */
@Controller('mcp')
export class McpController implements OnModuleDestroy {
  private readonly mcp: McpHttpHandler;
  private readonly handle: NodeMcpRequestHandler;
  private readonly sameMachineOnly = localhostOriginValidation();

  constructor(relay: RelayMcpServer) {
    this.mcp = createMcpHandler(() => relay.create());
    this.handle = toNodeHandler(this.mcp);
  }

  @All()
  async serve(@Req() req: Request, @Res() res: Response) {
    if (!this.sameMachineOnly(req, res)) return;
    await this.handle(req, res, req.body);
  }

  onModuleDestroy() {
    return this.mcp.close();
  }
}
