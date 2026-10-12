import { Injectable } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/server';
import { RelayToolDeps } from './relay-tool-deps.js';
import { registerCatalogTools } from './tools/catalog-tools.js';
import { registerRunTools } from './tools/run-tools.js';
import { registerWorkflowReadTools } from './tools/workflow-read-tools.js';
import { registerWorkflowWriteTools } from './tools/workflow-write-tools.js';

const INSTRUCTIONS = `Relay runs automations (workflows) on the user's computer. To build one: list_step_types, then list_step_types with the types you will use, then save_workflow and fix the issues it reports (blanks for personal details are fine; tell the user which to fill in, with the link). Ask before publish_workflow or run_workflow: steps act for real.`;

/** Relay as an MCP server, one instance per request, acting as the token's owner. */
@Injectable()
export class RelayMcpServer {
  constructor(private readonly deps: RelayToolDeps) {}

  create(ownerId: string): McpServer {
    const server = new McpServer(
      { name: 'relay', version: '0.1.0' },
      { instructions: INSTRUCTIONS },
    );
    registerWorkflowReadTools(server, this.deps, ownerId);
    registerCatalogTools(server, this.deps, ownerId);
    registerWorkflowWriteTools(server, this.deps, ownerId);
    registerRunTools(server, this.deps, ownerId);
    return server;
  }
}
