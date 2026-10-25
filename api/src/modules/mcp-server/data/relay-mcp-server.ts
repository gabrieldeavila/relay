import { Inject, Injectable } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/server';
import { AssetStore } from '../../assets/data/asset-store.js';
import { assetMcpTools } from '../../assets/delivery/asset-mcp-tools.js';
import {
  IMAGE_GENERATOR,
  type ImageGenerator,
} from '../../generation/data/image-generator.js';
import { generationMcpTools } from '../../generation/delivery/generation-mcp-tools.js';
import { ImageDocuments } from '../../images/data/image-documents.js';
import { imageMcpTools } from '../../images/delivery/image-mcp-tools.js';
import { VideoExports } from '../../videos/data/video-exports.js';
import { VideoProjects } from '../../videos/data/video-projects.js';
import { VideoRenderer } from '../../videos/data/video-renderer.js';
import { videoMcpTools } from '../../videos/delivery/video-mcp-tools.js';
import type { McpTool } from '../domain/mcp-tool.js';
import { serverInstructions } from '../domain/server-instructions.js';
import { registerMcpTools } from './register-mcp-tools.js';

/** Relay as an MCP server: one instance per request, sharing the same tools. */
@Injectable()
export class RelayMcpServer {
  readonly tools: McpTool[];
  private readonly instructions: string;

  constructor(
    assets: AssetStore,
    images: ImageDocuments,
    projects: VideoProjects,
    renderer: VideoRenderer,
    exports: VideoExports,
    @Inject(IMAGE_GENERATOR) generator: ImageGenerator | null,
  ) {
    this.tools = [
      ...assetMcpTools(assets),
      ...imageMcpTools(images),
      ...generationMcpTools(generator, assets),
      ...videoMcpTools({ projects, renderer, exports, assets }),
    ];
    assertUniqueNames(this.tools);
    this.instructions = serverInstructions({ canGenerate: Boolean(generator) });
  }

  create(): McpServer {
    const server = new McpServer(
      { name: 'relay', version: '0.2.0' },
      { instructions: this.instructions },
    );
    registerMcpTools(server, this.tools);
    return server;
  }
}

function assertUniqueNames(tools: McpTool[]) {
  const seen = new Set<string>();
  for (const { name } of tools) {
    if (seen.has(name)) throw new Error(`Two MCP tools are named ${name}`);
    seen.add(name);
  }
}
