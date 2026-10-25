import { createCanvas, loadImage } from '@napi-rs/canvas';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

/** Providers may answer JPEG or WebP; assets from generation are always PNG. */
export async function toPng(bytes: Buffer): Promise<Buffer> {
  if (bytes.subarray(0, 4).equals(PNG_SIGNATURE)) return bytes;
  const image = await loadImage(bytes).catch(() => {
    throw new Error('The image AI returned something that is not an image');
  });
  const canvas = createCanvas(image.width, image.height);
  canvas.getContext('2d').drawImage(image, 0, 0);
  return canvas.toBuffer('image/png');
}
