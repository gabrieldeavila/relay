export type TimelineClip = {
  id: string;
  kind: "media" | "image" | "text";
  layer: number;
  start: number;
  end: number;
  assetName?: string | null;
  text?: string;
};

export type ExportedAsset = { url: string; durationSeconds: number | null };

export type VideoDetails = {
  id: string;
  name: string;
  width: number;
  height: number;
  fps: number;
  durationSeconds: number;
  clipsByLayer: TimelineClip[];
  latestExport: ExportedAsset | null;
};
