import { promptFor, type GenerateRequest } from '../domain/generate-request.js';
import type {
  GenerationConfig,
  ProviderReply,
} from '../domain/provider-spec.js';
import { PROVIDERS } from '../domain/providers/provider-catalog.js';
import type { ImageGenerator } from './image-generator.js';
import { downloadImage, sendCall } from './send-call.js';
import { toPng } from './to-png.js';

const POLL_EVERY_MS = 1500;
const MAX_POLLS = 120;

/** The image AI named by the config, behind one "prompt in, PNG out" interface. */
export function createImageGenerator(config: GenerationConfig): ImageGenerator {
  const spec = PROVIDERS[config.provider];
  const read = (json: unknown) => spec.readReply(json, config);

  return {
    label: `${spec.label} (${config.model})`,
    canBeTransparent: spec.canBeTransparent,
    async generate(request: GenerateRequest) {
      const prompt = promptFor(request, spec.canBeTransparent);
      let reply = read(await sendCall(spec.call(config, request, prompt)));
      for (let polls = 0; reply.kind === 'pending'; polls++) {
        if (polls >= MAX_POLLS) throw new Error('The image AI took too long');
        await new Promise((resolve) => setTimeout(resolve, POLL_EVERY_MS));
        reply = read(await sendCall(reply.poll));
      }
      return toPng(await bytesOf(reply));
    },
  };
}

async function bytesOf(reply: Exclude<ProviderReply, { kind: 'pending' }>) {
  if (reply.kind === 'failed') throw new Error(reply.reason);
  if (reply.kind === 'url') return downloadImage(reply.url);
  return Buffer.from(reply.base64, 'base64');
}
