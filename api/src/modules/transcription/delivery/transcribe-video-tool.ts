import { z } from 'zod';
import { resolveMedia } from '../../assets/data/resolve-media.js';
import type { AssetStore } from '../../assets/data/asset-store.js';
import type { McpTool } from '../../mcp-server/domain/mcp-tool.js';
import type { Transcriber } from '../data/transcriber.js';
import { transcriptLines } from '../domain/transcript-lines.js';
import { languageField } from './transcription-fields.js';

const INPUT = {
  assetId: z.string().optional(),
  path: z.string().optional().describe('Local file, e.g. "~/Movies/vlog.mov"'),
  url: z.string().optional(),
  language: languageField,
};

/** `transcribe_video`: what is said in a file, sentence by sentence with times. */
export function transcribeVideoTool(
  transcriber: Transcriber,
  assets: Pick<AssetStore, 'get' | 'importPath' | 'importUrl'>,
): McpTool {
  return {
    name: 'transcribe_video',
    title: 'Transcribe video',
    description:
      'Turns the speech in a video or audio file (asset, local path or URL) into text, one sentence per line with its time in seconds of the source file, e.g. "[12.4–15.0] …". Runs on this computer; the first time takes a while for long files, then it is cached. Use the times as in/out with add_clip to cut the best moments into a short; use auto_captions to put the words on a video.',
    input: INPUT,
    readOnly: true,
    async run(input) {
      const { language, ...media } = z.object(INPUT).parse(input);
      const asset = await resolveMedia(assets, media);
      const transcript = await transcriber.transcribe(asset, language);
      const lines = transcriptLines(transcript);
      const header = `${asset.name} (asset ${asset.id}), language ${transcript.language}, ${transcript.words.length} words:`;
      return {
        text: lines.length
          ? [header, ...lines].join('\n')
          : `No speech found in ${asset.name}.`,
        data: { assetId: asset.id, ...transcript },
      };
    },
  };
}
