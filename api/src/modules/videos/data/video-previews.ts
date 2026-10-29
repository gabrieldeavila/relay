import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ExportStatus } from '../domain/export-status.js';
import type { Timeline } from '../domain/timeline-types.js';
import { VideoRenderer } from './video-renderer.js';

/** The playback preview of one version of a project's timeline. */
export interface VideoPreview {
  /** Changes whenever the timeline does. */
  key: string;
  status: ExportStatus;
  progress: number;
  path: string;
  error: string | null;
}

/**
 * Small mp4s the editor plays, rendered on demand with the export pipeline.
 * Kept per project for its current timeline only, in a temp folder.
 */
@Injectable()
export class VideoPreviews {
  private readonly logger = new Logger(VideoPreviews.name);
  private readonly folder = join(tmpdir(), 'relay-previews');
  private readonly byProject = new Map<string, VideoPreview>();

  constructor(private readonly renderer: VideoRenderer) {}

  /** The preview of this timeline, starting its render if needed. */
  async ensure(projectId: string, timeline: Timeline): Promise<VideoPreview> {
    const key = keyOf(timeline);
    const current = this.byProject.get(projectId);
    if (current?.key === key && current.status !== 'failed') return current;
    if (current) await rm(current.path, { force: true });
    await mkdir(this.folder, { recursive: true });
    const preview: VideoPreview = {
      key,
      status: 'running',
      progress: 0,
      path: join(this.folder, `${projectId}-${key}.mp4`),
      error: null,
    };
    this.byProject.set(projectId, preview);
    void this.render(preview, timeline);
    return preview;
  }

  /** A finished preview's file, if `key` is still the latest one. */
  fileOf(projectId: string, key: string): string | null {
    const preview = this.byProject.get(projectId);
    return preview?.key === key && preview.status === 'done'
      ? preview.path
      : null;
  }

  private async render(preview: VideoPreview, timeline: Timeline) {
    try {
      await this.renderer.toFile(
        timeline,
        preview.path,
        (progress) => (preview.progress = progress),
        { preview: true },
      );
      preview.status = 'done';
      preview.progress = 1;
    } catch (error) {
      preview.status = 'failed';
      preview.error = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Preview ${preview.key} failed: ${preview.error}`);
    }
  }
}

const keyOf = (timeline: Timeline) =>
  createHash('sha1')
    .update(JSON.stringify(timeline))
    .digest('hex')
    .slice(0, 16);
