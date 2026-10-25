export type ImageSummary = {
  id: string;
  name: string;
  setup: { width: number; height: number };
  edits: number;
  updatedAt: string;
};

export type VideoSummary = {
  id: string;
  name: string;
  setup: { width: number; height: number; fps: number };
  updatedAt: string;
};
