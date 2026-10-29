import { Injectable } from '@nestjs/common';
import { readFile, writeFile } from 'node:fs/promises';
import { AssetStore } from '../../assets/data/asset-store.js';
import {
  buildFfmpegArgs,
  orderedClips,
  type RenderTarget,
} from '../domain/build-ffmpeg-args.js';
import { previewSize } from '../domain/preview-size.js';
import { groupTextRuns } from '../domain/text-runs.js';
import { clipAssetProblems } from '../domain/clip-asset-problems.js';
import { timelineDuration } from '../domain/clip-timing.js';
import { frameTimeline, stripTimes } from '../domain/frame-timeline.js';
import { timelineAssetIds } from '../domain/timeline-asset-ids.js';
import type { RenderInputs } from '../domain/render-inputs.js';
import type { Timeline } from '../domain/timeline-types.js';
import { runFfmpeg } from './ffmpeg-runner.js';
import { composeStrip } from './compose-strip.js';
import { renderTextOverlay } from './render-text-overlay.js';
import { withRenderFolder } from './render-workspace.js';
import { writeTextRuns } from './write-text-runs.js';

const FRAME_TIMEOUT_MS = 60_000;

/** Turns timelines into pixels with ffmpeg: single frames, contact sheets and mp4s. */
@Injectable()
export class VideoRenderer {
  constructor(private readonly assets: AssetStore) {}

  /** PNG of the frame at second t. */
  frame(timeline: Timeline, t: number): Promise<Buffer> {
    return withRenderFolder((fileIn) =>
      this.renderFrame(frameTimeline(timeline, t), fileIn, 'frame.png'),
    );
  }

  /** `count` frames spread over the video, labelled with their time, in one PNG. */
  strip(timeline: Timeline, count: number, frameWidth: number) {
    const times = stripTimes(timeline, count);
    return withRenderFolder(async (fileIn) => {
      const frames: Buffer[] = [];
      for (const [i, t] of times.entries()) {
        const moment = frameTimeline(timeline, t);
        frames.push(await this.renderFrame(moment, fileIn, `f${i}.png`));
      }
      return { image: await composeStrip(frames, times, frameWidth), times };
    });
  }

  /** Writes the whole video as an mp4 to `path`; `preview` makes it small and quick. */
  toFile(
    timeline: Timeline,
    path: string,
    onProgress: (progress: number) => void,
    { preview = false } = {},
  ): Promise<void> {
    return withRenderFolder(async (fileIn) => {
      const inputs = await this.inputsFor(timeline, fileIn);
      const target: RenderTarget = {
        kind: 'video',
        path,
        preview: preview ? previewSize(timeline.setup) : undefined,
      };
      await runFfmpeg(buildFfmpegArgs(timeline, inputs, target), {
        totalSeconds: timelineDuration(timeline),
        onProgress,
      });
    });
  }

  /** Problems that would stop the timeline from rendering, without rendering. */
  async problems(timeline: Timeline): Promise<string[]> {
    const assets = await this.assetsOf(timeline);
    return timeline.clips.flatMap((clip) =>
      clipAssetProblems(
        clip,
        'assetId' in clip ? assets.get(clip.assetId) : undefined,
      ).map((problem) => `${clip.id}: ${problem}`),
    );
  }

  private async renderFrame(
    timeline: Timeline,
    fileIn: (name: string) => string,
    name: string,
  ) {
    const inputs = await this.inputsFor(timeline, fileIn);
    const target: RenderTarget = { kind: 'frame', path: fileIn(name) };
    await runFfmpeg(buildFfmpegArgs(timeline, inputs, target), {
      timeoutMs: FRAME_TIMEOUT_MS,
    });
    return readFile(target.path);
  }

  private async inputsFor(
    timeline: Timeline,
    fileIn: (name: string) => string,
  ): Promise<RenderInputs> {
    const problems = await this.problems(timeline);
    if (problems.length > 0) throw new Error(problems.join('\n'));
    const assets = await this.assetsOf(timeline);
    const inputs: RenderInputs = { media: {}, textImages: {}, textRuns: {} };
    for (const asset of assets.values()) {
      inputs.media[asset.id] = {
        path: asset.path,
        hasVideo: asset.kind !== 'audio',
        hasAudio: asset.hasAudio,
      };
    }
    for (const clip of timeline.clips) {
      if (clip.kind !== 'text') continue;
      const path = fileIn(`text-${clip.id}.png`);
      await writeFile(path, renderTextOverlay(clip, timeline.setup));
      inputs.textImages[clip.id] = path;
    }
    inputs.textRuns = await writeTextRuns(
      groupTextRuns(orderedClips(timeline)),
      inputs.textImages,
      timeline.setup,
      fileIn,
    );
    return inputs;
  }

  private async assetsOf(timeline: Timeline) {
    const found = await this.assets.findMany(timelineAssetIds(timeline));
    return new Map(found.map((asset) => [asset.id, asset]));
  }
}
