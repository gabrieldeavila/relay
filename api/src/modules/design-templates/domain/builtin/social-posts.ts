import type { DesignTemplate } from '../design-template.js';
import {
  background,
  circle,
  FONT,
  FONTS,
  layer,
  photoSlot,
  rect,
  text,
} from '../design-blocks.js';

const boldAnnouncement: DesignTemplate = {
  name: 'bold-announcement',
  description: 'Big headline on a solid color, for news and launches',
  category: 'instagram-post',
  width: 1080,
  height: 1080,
  background: '#ff5a36',
  fonts: [FONTS.anton, FONTS.montserrat],
  fields: {
    headline: { kind: 'text', label: 'Headline', default: 'BIG NEWS' },
    subline: {
      kind: 'text',
      label: 'Subline',
      default: 'Something new is coming this Friday',
    },
    handle: { kind: 'text', label: 'Handle', default: '@yourbrand' },
    background: { kind: 'color', label: 'Background', default: '#ff5a36' },
    text_color: { kind: 'color', label: 'Text color', default: '#ffffff' },
  },
  steps: [
    background('{{background}}'),
    layer('Decor'),
    circle([920, 160], 280, 'rgba(255,255,255,0.14)'),
    rect({ x: 90, y: 710, width: 160, height: 14 }, '{{text_color}}'),
    layer('Headline'),
    text(
      '{{headline}}',
      { x: 90, y: 260, width: 900, height: 420 },
      {
        size: 240,
        font: FONT.anton,
        color: '{{text_color}}',
        lineHeight: 0.95,
        verticalAlign: 'bottom',
      },
    ),
    layer('Subline'),
    text(
      '{{subline}}',
      { x: 90, y: 760, width: 820, height: 150 },
      {
        size: 54,
        font: FONT.montserrat,
        weight: '700',
        color: '{{text_color}}',
      },
    ),
    layer('Handle'),
    text(
      '{{handle}}',
      { x: 90, y: 960, width: 900, height: 60 },
      {
        size: 34,
        font: FONT.montserrat,
        color: '{{text_color}}',
      },
    ),
  ],
};

const photoCaption: DesignTemplate = {
  name: 'photo-caption',
  description: 'Photo with a title and caption underneath, like a magazine',
  category: 'instagram-post',
  width: 1080,
  height: 1350,
  background: '#faf7f2',
  fonts: [FONTS.playfair, FONTS.montserrat],
  fields: {
    photo: { kind: 'image', label: 'Photo' },
    title: { kind: 'text', label: 'Title', default: 'Weekend in Lisbon' },
    caption: {
      kind: 'text',
      label: 'Caption',
      default: 'Pastel de nata, yellow trams and golden light.',
    },
    background: { kind: 'color', label: 'Background', default: '#faf7f2' },
  },
  steps: [
    background('{{background}}'),
    ...photoSlot('photo', { x: 60, y: 60, width: 960, height: 960 }),
    layer('Title'),
    text(
      '{{title}}',
      { x: 60, y: 1065, width: 960, height: 120 },
      {
        size: 84,
        font: FONT.playfair,
        weight: '700',
        color: '#1c1917',
      },
    ),
    layer('Caption'),
    text(
      '{{caption}}',
      { x: 60, y: 1200, width: 960, height: 100 },
      {
        size: 38,
        font: FONT.montserrat,
        color: '#57534e',
      },
    ),
  ],
};

const salePromo: DesignTemplate = {
  name: 'sale-promo',
  description: 'Loud sale post with the offer and a button',
  category: 'instagram-post',
  width: 1080,
  height: 1080,
  background: '#fde047',
  fonts: [FONTS.anton, FONTS.montserrat],
  fields: {
    eyebrow: { kind: 'text', label: 'Above the title', default: 'SUMMER' },
    headline: { kind: 'text', label: 'Headline', default: 'SALE' },
    offer: { kind: 'text', label: 'Offer', default: 'UP TO 50% OFF' },
    button: { kind: 'text', label: 'Button', default: 'SHOP NOW' },
    background: { kind: 'color', label: 'Background', default: '#fde047' },
    accent: { kind: 'color', label: 'Circle', default: '#111827' },
  },
  steps: [
    background('{{background}}'),
    layer('Circle'),
    circle([540, 540], 430, '{{accent}}'),
    layer('Text'),
    text(
      '{{eyebrow}}',
      { x: 190, y: 215, width: 700, height: 70 },
      {
        size: 56,
        font: FONT.montserrat,
        weight: '700',
        letterSpacing: 12,
        align: 'center',
        color: '{{background}}',
      },
    ),
    text(
      '{{headline}}',
      { x: 160, y: 320, width: 760, height: 300 },
      {
        size: 300,
        font: FONT.anton,
        align: 'center',
        verticalAlign: 'middle',
        color: '#ffffff',
      },
    ),
    text(
      '{{offer}}',
      { x: 190, y: 635, width: 700, height: 80 },
      {
        size: 64,
        font: FONT.montserrat,
        weight: '700',
        align: 'center',
        color: '{{background}}',
      },
    ),
    layer('Button'),
    rect({ x: 380, y: 760, width: 320, height: 84 }, '{{background}}', 42),
    text(
      '{{button}}',
      { x: 380, y: 760, width: 320, height: 84 },
      {
        size: 32,
        font: FONT.montserrat,
        weight: '700',
        align: 'center',
        verticalAlign: 'middle',
        color: '{{accent}}',
      },
    ),
  ],
};

export const SOCIAL_POSTS = [boldAnnouncement, photoCaption, salePromo];
