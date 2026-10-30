import type { AssetStore } from '../../assets/data/asset-store.js';
import type { TextTemplates } from '../../text-templates/data/text-templates.js';
import type { TranscriptFiles } from '../../transcription/data/transcript-files.js';
import type { VideoExports } from '../data/video-exports.js';
import type { VideoProjects } from '../data/video-projects.js';
import type { VideoRenderer } from '../data/video-renderer.js';

/** What the video MCP tools work with. */
export interface VideoServices {
  projects: VideoProjects;
  renderer: VideoRenderer;
  exports: VideoExports;
  assets: AssetStore;
  templates: TextTemplates;
  transcripts: TranscriptFiles;
}
