import { createCanvas, loadImage } from '@napi-rs/canvas';

const COLUMNS = 4;
const LABEL_HEIGHT = 22;
const GAP = 4;

/** Frames side by side (4 per row), each labelled with its time, as one PNG. */
export async function composeStrip(
  frames: Buffer[],
  times: number[],
  frameWidth: number,
): Promise<Buffer> {
  const images = await Promise.all(frames.map((frame) => loadImage(frame)));
  const scale = frameWidth / images[0].width;
  const frameHeight = Math.round(images[0].height * scale);
  const columns = Math.min(COLUMNS, images.length);
  const rows = Math.ceil(images.length / columns);
  const cellHeight = frameHeight + LABEL_HEIGHT;
  const canvas = createCanvas(
    columns * frameWidth + (columns - 1) * GAP,
    rows * cellHeight + (rows - 1) * GAP,
  );
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#111111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = '14px sans-serif';
  ctx.textBaseline = 'middle';
  images.forEach((image, i) => {
    const x = (i % columns) * (frameWidth + GAP);
    const y = Math.floor(i / columns) * (cellHeight + GAP);
    ctx.drawImage(image, x, y, frameWidth, frameHeight);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(
      `${times[i].toFixed(2)}s`,
      x + 6,
      y + frameHeight + LABEL_HEIGHT / 2,
    );
  });
  return canvas.toBuffer('image/png');
}
