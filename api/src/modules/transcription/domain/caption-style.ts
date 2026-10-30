import type { TextTemplate } from '../../text-templates/domain/text-template.js';
import type {
  Box,
  TextStyle,
  VideoSetup,
} from '../../videos/domain/timeline-types.js';
import {
  captionHighlight,
  type CaptionHighlightMode,
  type WordHighlightLook,
} from './caption-highlight.js';

export const CAPTION_STYLES = ['bold', 'yellow', 'boxed', 'clean'] as const;
export type CaptionStyleName = (typeof CAPTION_STYLES)[number];

export const CAPTION_POSITIONS = ['lower', 'middle', 'top'] as const;
export type CaptionPosition = (typeof CAPTION_POSITIONS)[number];

/** How a preset looks, before it is sized to the video. */
interface CaptionPreset {
  uppercase: boolean;
  color: string;
  weight: TextStyle['weight'];
  stroke: string | null;
  /** Outline thickness as a share of the font size. */
  strokeRatio: number;
  background: string | null;
}

const PRESETS: Record<CaptionStyleName, CaptionPreset> = {
  bold: {
    uppercase: true,
    color: '#ffffff',
    weight: '900',
    stroke: '#000000',
    strokeRatio: 0.12,
    background: null,
  },
  yellow: {
    uppercase: true,
    color: '#ffe600',
    weight: '900',
    stroke: '#000000',
    strokeRatio: 0.12,
    background: null,
  },
  boxed: {
    uppercase: false,
    color: '#ffffff',
    weight: 'bold',
    stroke: null,
    strokeRatio: 0,
    background: 'rgba(0, 0, 0, 0.65)',
  },
  clean: {
    uppercase: false,
    color: '#ffffff',
    weight: 'bold',
    stroke: '#000000',
    strokeRatio: 0.05,
    background: null,
  },
};

export interface CaptionLook {
  style: TextStyle;
  box: Box;
  uppercase: boolean;
  /** How the spoken word stands out; null shows whole captions only. */
  highlight: WordHighlightLook | null;
}

export interface CaptionLookOptions {
  style: CaptionStyleName;
  /** Used instead of the style preset when given. */
  template?: TextTemplate;
  position: CaptionPosition;
  font?: string;
  color?: string;
  /** Font size in pixels; default scales with the video width. */
  size?: number;
  highlight?: CaptionHighlightMode;
  highlightColor?: string;
}

/** The text style and caption area for a preset, sized to the video. */
export function captionLook(
  setup: VideoSetup,
  options: CaptionLookOptions,
): CaptionLook {
  const template = options.template;
  const preset = template ?? PRESETS[options.style];
  const size =
    options.size ?? Math.round(Math.min(setup.width, setup.height) * 0.075);
  const color = options.color ?? preset.color;
  return {
    uppercase: preset.uppercase,
    box: captionBox(setup, options.position, size),
    highlight: captionHighlight(
      options.highlight ?? 'none',
      color,
      options.highlightColor,
    ),
    style: {
      font: options.font ?? template?.font ?? 'sans-serif',
      size,
      weight: preset.weight,
      color,
      align: 'center',
      verticalAlign: 'middle',
      lineHeight: template?.lineHeight ?? 1.1,
      letterSpacing: Math.round(size * (template?.letterSpacingRatio ?? 0)),
      stroke: preset.stroke,
      strokeWidth: Math.round(size * preset.strokeRatio),
      background: preset.background,
      fit: 'shrink',
    },
  };
}

/** Room for two lines, across most of the width, at the chosen height. */
function captionBox(
  setup: VideoSetup,
  position: CaptionPosition,
  size: number,
): Box {
  const width = Math.round(setup.width * 0.88);
  const height = Math.min(Math.round(size * 2.6), setup.height);
  const centerY =
    { lower: 0.72, middle: 0.5, top: 0.15 }[position] * setup.height;
  return {
    x: Math.round((setup.width - width) / 2),
    y: Math.round(
      Math.max(0, Math.min(setup.height - height, centerY - height / 2)),
    ),
    width,
    height,
  };
}
