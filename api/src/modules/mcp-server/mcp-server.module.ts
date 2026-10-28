import { Module } from '@nestjs/common';
import { AssetsModule } from '../assets/assets.module.js';
import { GenerationModule } from '../generation/generation.module.js';
import { ImagesModule } from '../images/images.module.js';
import { TranscriptionModule } from '../transcription/transcription.module.js';
import { VideosModule } from '../videos/videos.module.js';
import { RelayMcpServer } from './data/relay-mcp-server.js';
import { McpController } from './delivery/mcp.controller.js';

@Module({
  imports: [
    AssetsModule,
    GenerationModule,
    ImagesModule,
    TranscriptionModule,
    VideosModule,
  ],
  controllers: [McpController],
  providers: [RelayMcpServer],
})
export class McpServerModule {}
