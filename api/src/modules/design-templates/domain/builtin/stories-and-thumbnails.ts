import type { DesignTemplate } from '../design-template.js';
import {
  FONT,
  FONTS,
  gradient,
  layer,
  photoSlot,
  rect,
  text,
} from '../design-blocks.js';

const storyPhotoTitle: DesignTemplate = {
  name: 'story-photo-title',
  description: 'Full-screen photo with a big title and a button at the bottom',
  category: 'instagram-story',
  width: 1080,
  height: 1920,
  background: '#111111',
  fonts: [FONTS.bebas, FONTS.montserrat],
  fields: {
    photo: { kind: 'image', label: 'Photo' },
    title: { kind: 'text', label: 'Title', default: 'NEW COLLECTION' },
    subtitle: {
      kind: 'text',
      label: 'Subtitle',
      default: 'Available now in store and online',
    },
    button: { kind: 'text', label: 'Button', default: 'SHOP NOW' },
    accent: { kind: 'color', label: 'Button color', default: '#facc15' },
  },
  steps: [
    ...photoSlot(
      'photo',
      { x: 0, y: 0, width: 1080, height: 1920 },
      { x: 0, y: 400, width: 1080, height: 500 },
    ),
    layer('Shade'),
    gradient([0, 850], [0, 1920], ['rgba(0,0,0,0)', 'rgba(0,0,0,0.85)']),
    layer('Title'),
    text(
      '{{title}}',
      { x: 80, y: 1200, width: 920, height: 400 },
      {
        size: 220,
        font: FONT.bebas,
        color: '#ffffff',
        lineHeight: 0.9,
        verticalAlign: 'bottom',
      },
    ),
    layer('Subtitle'),
    text(
      '{{subtitle}}',
      { x: 80, y: 1625, width: 920, height: 110 },
      {
        size: 48,
        font: FONT.montserrat,
        color: '#ffffff',
      },
    ),
    layer('Button'),
    rect({ x: 80, y: 1760, width: 420, height: 96 }, '{{accent}}', 48),
    text(
      '{{button}}',
      { x: 80, y: 1760, width: 420, height: 96 },
      {
        size: 38,
        font: FONT.montserrat,
        weight: '700',
        align: 'center',
        verticalAlign: 'middle',
        color: '#111111',
      },
    ),
  ],
};

const thumbnailBold: DesignTemplate = {
  name: 'thumbnail-bold',
  description: 'YouTube thumbnail: photo, huge outlined headline and a tag',
  category: 'youtube-thumbnail',
  width: 1280,
  height: 720,
  background: '#111827',
  fonts: [FONTS.anton, FONTS.montserrat],
  fields: {
    photo: { kind: 'image', label: 'Photo' },
    headline: {
      kind: 'text',
      label: 'Headline',
      default: "YOU WON'T BELIEVE THIS",
    },
    tag: { kind: 'text', label: 'Tag', default: 'NEW' },
    text_color: { kind: 'color', label: 'Headline color', default: '#facc15' },
    tag_color: { kind: 'color', label: 'Tag color', default: '#ef4444' },
  },
  steps: [
    ...photoSlot(
      'photo',
      { x: 0, y: 0, width: 1280, height: 720 },
      { x: 820, y: 0, width: 460, height: 720 },
    ),
    layer('Shade'),
    gradient([0, 0], [900, 0], ['rgba(0,0,0,0.85)', 'rgba(0,0,0,0)']),
    layer('Headline'),
    text(
      '{{headline}}',
      { x: 50, y: 130, width: 720, height: 540 },
      {
        size: 190,
        font: FONT.anton,
        color: '{{text_color}}',
        stroke: '#000000',
        strokeWidth: 12,
        lineHeight: 0.95,
        verticalAlign: 'middle',
      },
    ),
    layer('Tag'),
    rect({ x: 50, y: 50, width: 190, height: 70 }, '{{tag_color}}', 10),
    text(
      '{{tag}}',
      { x: 50, y: 50, width: 190, height: 70 },
      {
        size: 40,
        font: FONT.montserrat,
        weight: '700',
        align: 'center',
        verticalAlign: 'middle',
        color: '#ffffff',
      },
    ),
  ],
};

export const STORIES_AND_THUMBNAILS = [storyPhotoTitle, thumbnailBold];
