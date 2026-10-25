import { addClipTool } from './add-clip-tool.js';
import { addTextTool } from './add-text-tool.js';
import { createBatchVideoTool } from './batch-video-tool.js';
import { editClipTools } from './edit-clip-tools.js';
import type { VideoEditTool } from './video-edit-tool.js';

const SINGLE_EDITS: VideoEditTool[] = [
  addClipTool,
  addTextTool,
  ...editClipTools,
];

/** Every tool that changes a timeline, batch included. */
export const VIDEO_EDIT_TOOLS: VideoEditTool[] = [
  ...SINGLE_EDITS,
  createBatchVideoTool(SINGLE_EDITS),
];
