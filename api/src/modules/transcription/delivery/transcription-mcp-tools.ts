import type { McpTool } from '../../mcp-server/domain/mcp-tool.js';
import type { VideoServices } from '../../videos/delivery/video-services.js';
import type { Transcriber } from '../data/transcriber.js';
import { autoCaptionsTool } from './auto-captions-tool.js';
import { transcribeVideoTool } from './transcribe-video-tool.js';

/** `transcribe_video` and `auto_captions`, only offered when whisper is set up. */
export function transcriptionMcpTools(
  transcriber: Transcriber | null,
  services: VideoServices,
): McpTool[] {
  if (!transcriber) return [];
  return [
    transcribeVideoTool(transcriber, services.assets),
    autoCaptionsTool(transcriber, services),
  ];
}
