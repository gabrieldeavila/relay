export type Layer = {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  blendMode: string;
  mask: { enabled: boolean } | null;
};

export type ImageEdit = {
  type: string;
  edits: number;
  source: string;
  at: string;
};

export type ImageDetails = {
  id: string;
  name: string;
  version: number;
  width: number;
  height: number;
  activeLayerId: string;
  layersBottomToTop: Layer[];
  canUndo: boolean;
  canRedo: boolean;
  recentEdits: ImageEdit[];
};
