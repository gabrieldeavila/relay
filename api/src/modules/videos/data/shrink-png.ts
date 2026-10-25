import { createCanvas, loadImage } from '@napi-rs/canvas';

/** Scales a PNG down so its longest side is at most maxSize (never up). */
export async function shrinkPng(png: Buffer, maxSize: number): Promise<Buffer> {
  const image = await loadImage(png);
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  if (scale === 1) return png;
  const canvas = createCanvas(
    Math.round(image.width * scale),
    Math.round(image.height * scale),
  );
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toBuffer('image/png');
}
