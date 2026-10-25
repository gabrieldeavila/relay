export type AssetKind = 'image' | 'video' | 'audio';

/** Where an asset came from: brought in by the user/AI, or rendered by Relay. */
export type AssetSource = 'import' | 'export';

/** A media file Relay keeps on disk, usable by both images and videos. */
export interface Asset {
  id: string;
  kind: AssetKind;
  name: string;
  mimeType: string;
  bytes: number;
  width: number | null;
  height: number | null;
  durationMs: number | null;
  hasAudio: boolean;
  source: AssetSource;
  path: string;
  createdAt: Date;
}
