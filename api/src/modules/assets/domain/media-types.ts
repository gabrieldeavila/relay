import type { AssetKind } from './asset.js';

interface MediaType {
  mimeType: string;
  kind: AssetKind;
}

const BY_EXTENSION: Record<string, MediaType> = {
  png: { mimeType: 'image/png', kind: 'image' },
  jpg: { mimeType: 'image/jpeg', kind: 'image' },
  jpeg: { mimeType: 'image/jpeg', kind: 'image' },
  webp: { mimeType: 'image/webp', kind: 'image' },
  gif: { mimeType: 'image/gif', kind: 'image' },
  avif: { mimeType: 'image/avif', kind: 'image' },
  bmp: { mimeType: 'image/bmp', kind: 'image' },
  mp4: { mimeType: 'video/mp4', kind: 'video' },
  m4v: { mimeType: 'video/mp4', kind: 'video' },
  mov: { mimeType: 'video/quicktime', kind: 'video' },
  webm: { mimeType: 'video/webm', kind: 'video' },
  mkv: { mimeType: 'video/x-matroska', kind: 'video' },
  mp3: { mimeType: 'audio/mpeg', kind: 'audio' },
  wav: { mimeType: 'audio/wav', kind: 'audio' },
  m4a: { mimeType: 'audio/mp4', kind: 'audio' },
  aac: { mimeType: 'audio/aac', kind: 'audio' },
  ogg: { mimeType: 'audio/ogg', kind: 'audio' },
  flac: { mimeType: 'audio/flac', kind: 'audio' },
};

/** `clip.MOV` → mov; '' when there is none. */
export function extensionOf(fileName: string): string {
  const match = /\.([A-Za-z0-9]{1,5})$/.exec(fileName.trim());
  return match ? match[1].toLowerCase() : '';
}

/** The media type of a file name, or null when Relay can't use it. */
export function mediaTypeOf(fileName: string): MediaType | null {
  return BY_EXTENSION[extensionOf(fileName)] ?? null;
}

/** The extension to save a content type with (`image/jpeg` → jpg), or null. */
export function extensionFor(mimeType: string): string | null {
  const clean = mimeType.split(';')[0].trim().toLowerCase();
  const found = Object.entries(BY_EXTENSION).find(
    ([, type]) => type.mimeType === clean,
  );
  return found ? found[0] : null;
}

export const SUPPORTED_EXTENSIONS = Object.keys(BY_EXTENSION);
