import { listCaptionsTool } from '../../captions/delivery/list-captions-tool.js';
import type { McpTool } from '../../mcp-server/domain/mcp-tool.js';
import { VIDEO_EDIT_TOOLS } from './tools/video-edit-catalog.js';
import type { VideoEditTool } from './tools/video-edit-tool.js';
import { videoIdField } from './tools/video-fields.js';
import { videoProjectTools } from './video-project-tools.js';
import { videoRenderTools } from './video-render-tools.js';
import type { VideoServices } from './video-services.js';

/** Every video tool for MCP: projects, timeline edits (which take a videoId) and rendering. */
export function videoMcpTools(services: VideoServices): McpTool[] {
  return [
    ...videoProjectTools(services),
    ...VIDEO_EDIT_TOOLS.map((tool) => editTool(tool, services)),
    ...videoRenderTools(services),
    listCaptionsTool(services),
  ];
}

function editTool(tool: VideoEditTool, s: VideoServices): McpTool {
  return {
    name: tool.name,
    title: tool.title,
    description: tool.description,
    input: { videoId: videoIdField, ...tool.input },
    async run({ videoId, ...input }) {
      let text = '';
      let after: (() => Promise<string | null>) | undefined;
      await s.projects.edit(
        videoId as string,
        tool.name,
        async (timeline) => {
          const planned = await tool.plan(input, timeline, {
            assets: s.assets,
            templates: s.templates,
            transcripts: s.transcripts,
          });
          text = planned.text;
          after = planned.after;
          return planned.commands;
        },
        async (timeline) => {
          const problems = await s.renderer.problems(timeline);
          if (problems.length > 0) throw new Error(problems.join('\n'));
        },
      );
      const note = after ? await after() : null;
      return { text: note ? `${text}\n${note}` : text };
    },
  };
}
