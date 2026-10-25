import { Module } from '@nestjs/common';
import { AssetsModule } from '../assets/assets.module.js';
import { VideoExports } from './data/video-exports.js';
import { VideoExportsRepository } from './data/video-exports.repository.js';
import { VideoProjects } from './data/video-projects.js';
import { VideoProjectsRepository } from './data/video-projects.repository.js';
import { VideoRenderer } from './data/video-renderer.js';
import { VideosController } from './delivery/videos.controller.js';

@Module({
  imports: [AssetsModule],
  controllers: [VideosController],
  providers: [
    VideoProjectsRepository,
    VideoProjects,
    VideoRenderer,
    VideoExportsRepository,
    VideoExports,
  ],
  exports: [VideoProjects, VideoRenderer, VideoExports],
})
export class VideosModule {}
