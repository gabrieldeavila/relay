import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { orNotFound } from '../../../http/or-not-found.js';
import { publicUrl } from '../../../public-url.js';
import { VideoPreviews } from '../data/video-previews.js';
import { VideoProjects } from '../data/video-projects.js';

/** Playback previews for the editor: start one, then stream its mp4. */
@Controller('videos')
export class VideoPreviewsController {
  constructor(
    private readonly projects: VideoProjects,
    private readonly previews: VideoPreviews,
  ) {}

  /** The current timeline's preview; starts rendering it if needed. Poll it. */
  @Post(':id/preview')
  async preview(@Param('id') id: string) {
    const project = await orNotFound(this.projects.get(id));
    const preview = await this.previews.ensure(id, project.timeline);
    return {
      status: preview.status,
      progress: preview.progress,
      error: preview.error,
      url:
        preview.status === 'done'
          ? `${publicUrl()}/videos/${id}/preview/${preview.key}.mp4`
          : null,
    };
  }

  /** Served with range support, so the player can seek. */
  @Get(':id/preview/:key.mp4')
  file(
    @Param('id') id: string,
    @Param('key') key: string,
    @Res() res: Response,
  ) {
    const path = this.previews.fileOf(id, key);
    if (!path) throw new NotFoundException('That preview is out of date');
    res.set('cache-control', 'private, max-age=3600').sendFile(path);
  }
}
