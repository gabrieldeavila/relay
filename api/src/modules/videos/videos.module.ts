import { Module } from '@nestjs/common';
import { AssetsModule } from '../assets/assets.module.js';
import { VideoExports } from './data/video-exports.js';
import { VideoExportsRepository } from './data/video-exports.repository.js';
import { VideoPreviews } from './data/video-previews.js';
import { VideoProjects } from './data/video-projects.js';
import { VideoProjectsRepository } from './data/video-projects.repository.js';
import { VideoRenderer } from './data/video-renderer.js';
import { VideoPreviewsController } from './delivery/video-previews.controller.js';
import { VideosController } from './delivery/videos.controller.js';

@Module({
  imports: [AssetsModule],
  controllers: [VideosController, VideoPreviewsController],
  providers: [
    VideoProjectsRepository,
    VideoProjects,
    VideoRenderer,
    VideoExportsRepository,
    VideoExports,
    VideoPreviews,
  ],
  exports: [VideoProjects, VideoRenderer, VideoExports],
})
export class VideosModule {}
