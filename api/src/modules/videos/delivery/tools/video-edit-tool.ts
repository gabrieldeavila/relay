import type { z } from 'zod';
import type { AssetStore } from '../../../assets/data/asset-store.js';
import type { TextTemplates } from '../../../text-templates/data/text-templates.js';
import type { TranscriptFiles } from '../../../transcription/data/transcript-files.js';
import type { Timeline } from '../../domain/timeline-types.js';
import type { VideoCommand } from '../../domain/video-command-types.js';

export interface VideoEditDeps {
  assets: Pick<AssetStore, 'get' | 'importPath' | 'importUrl'>;
  templates: Pick<TextTemplates, 'use'>;
  transcripts: TranscriptFiles;
}

/** The commands an edit makes, and what to tell the AI about it. */
export interface EditPlanResult {
  commands: VideoCommand[];
  text: string;
  /** Runs once the edit is saved (e.g. fixing files outside the timeline); returns a note. */
  after?: () => Promise<string | null>;
}

/** A tool that changes a timeline: it plans commands from the current timeline. */
export interface VideoEditTool<Shape extends z.ZodRawShape = z.ZodRawShape> {
  name: string;
  title: string;
  description: string;
  input: Shape;
  plan(
    input: z.infer<z.ZodObject<Shape>>,
    timeline: Timeline,
    deps: VideoEditDeps,
  ): EditPlanResult | Promise<EditPlanResult>;
}

export function defineVideoEdit<Shape extends z.ZodRawShape>(
  tool: VideoEditTool<Shape>,
): VideoEditTool {
  return tool;
}
