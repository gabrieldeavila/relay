/** A file ffmpeg reads for an asset, and what streams it has. */
export interface MediaFile {
  path: string;
  hasVideo: boolean;
  hasAudio: boolean;
}

/** Files a timeline needs to render. */
export interface RenderInputs {
  /** By asset id. */
  media: Record<string, MediaFile>;
  /** Transparent full-frame PNG of each text clip, by clip id. */
  textImages: Record<string, string>;
}

/** Seconds as ffmpeg likes them: plain decimals, at most milliseconds. */
export const seconds = (value: number) => String(Number(value.toFixed(3)));
