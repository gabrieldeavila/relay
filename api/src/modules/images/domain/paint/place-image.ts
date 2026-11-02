import type { CommandOf } from '../commands/command-types.js';
import type { Ctx, PaintEnv } from './surface.js';

export async function placeImage(
  ctx: Ctx,
  cmd: CommandOf<'place_image'>,
  env: PaintEnv,
): Promise<void> {
  const image = await env.loadImage(cmd.src);
  const { x, y, width, height } = cmd.rect;
  ctx.save();
  if (cmd.clip) {
    ctx.beginPath();
    ctx.rect(cmd.clip.x, cmd.clip.y, cmd.clip.width, cmd.clip.height);
    ctx.clip();
  }
  ctx.drawImage(image, x, y, width, height);
  ctx.restore();
}
