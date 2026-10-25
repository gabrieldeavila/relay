import { Controller, Get, Param, Query, Res, Sse } from '@nestjs/common';
import type { Response } from 'express';
import { Observable } from 'rxjs';
import { orNotFound } from '../../../http/or-not-found.js';
import { publicUrl } from '../../../public-url.js';
import { AssetStore } from '../../assets/data/asset-store.js';
import { describeAsset } from '../../assets/domain/describe-asset.js';
import { assetNamesOf } from '../data/asset-names.js';
import { shrinkPng } from '../data/shrink-png.js';
import { VideoExports } from '../data/video-exports.js';
import { VideoProjects } from '../data/video-projects.js';
import { VideoRenderer } from '../data/video-renderer.js';
import { describeTimeline } from '../domain/describe-timeline.js';

/** Read-only views of video projects for the UI; editing happens over MCP. */
@Controller('videos')
export class VideosController {
  constructor(
    private readonly projects: VideoProjects,
    private readonly renderer: VideoRenderer,
    private readonly exports: VideoExports,
    private readonly assets: AssetStore,
  ) {}

  @Get()
  async list() {
    return (await this.projects.list()).map((row) => ({
      id: row.id,
      name: row.name,
      setup: row.setup,
      updatedAt: row.updatedAt,
    }));
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const project = await orNotFound(this.projects.get(id));
    const done = await this.exports.latestDone(id);
    const exported = done?.assetId
      ? describeAsset(await this.assets.get(done.assetId), publicUrl())
      : null;
    return {
      id,
      name: project.name,
      ...describeTimeline(
        project.timeline,
        await assetNamesOf(this.assets, project.timeline),
      ),
      canUndo: project.history.cursor > 0,
      latestExport: exported,
    };
  }

  @Get(':id/frame.png')
  async frame(
    @Param('id') id: string,
    @Query('t') t: string | undefined,
    @Res() res: Response,
  ) {
    const project = await orNotFound(this.projects.get(id));
    const png = await this.renderer.frame(project.timeline, Number(t) || 0);
    res
      .type('png')
      .set('cache-control', 'no-store')
      .send(await shrinkPng(png, 720));
  }

  /** `{ version }` every time the project changes. */
  @Sse(':id/events')
  events(@Param('id') id: string) {
    return new Observable<{ data: { version: number } }>((subscriber) =>
      this.projects
        .changes(id)
        .subscribe(({ version }) => subscriber.next({ data: { version } })),
    );
  }
}
