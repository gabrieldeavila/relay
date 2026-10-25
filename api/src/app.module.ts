import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module.js';
import { AssetsModule } from './modules/assets/assets.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { ImagesModule } from './modules/images/images.module.js';
import { McpServerModule } from './modules/mcp-server/mcp-server.module.js';
import { VideosModule } from './modules/videos/videos.module.js';

@Module({
  imports: [
    DatabaseModule,
    HealthModule,
    AssetsModule,
    ImagesModule,
    VideosModule,
    McpServerModule,
  ],
})
export class AppModule {}
