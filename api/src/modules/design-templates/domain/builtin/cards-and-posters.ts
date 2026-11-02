import type { DesignTemplate } from '../design-template.js';
import {
  FONT,
  FONTS,
  background,
  gradient,
  layer,
  photoSlot,
  rect,
  text,
} from '../design-blocks.js';

const quoteCard: DesignTemplate = {
  name: 'quote-card',
  description: 'A quote and its author on a two-color gradient',
  category: 'instagram-post',
  width: 1080,
  height: 1080,
  background: '#6d28d9',
  fonts: [FONTS.playfair, FONTS.montserrat],
  fields: {
    quote: {
      kind: 'text',
      label: 'Quote',
      default: 'Simplicity is the ultimate sophistication.',
    },
    author: { kind: 'text', label: 'Author', default: 'Leonardo da Vinci' },
    color_a: { kind: 'color', label: 'Gradient start', default: '#6d28d9' },
    color_b: { kind: 'color', label: 'Gradient end', default: '#db2777' },
  },
  steps: [
    gradient([0, 0], [1080, 1080], ['{{color_a}}', '{{color_b}}']),
    layer('Quote mark'),
    text(
      '“',
      { x: 80, y: 0, width: 360, height: 470 },
      {
        size: 380,
        fit: 'none',
        font: FONT.playfair,
        weight: '700',
        color: 'rgba(255,255,255,0.25)',
      },
    ),
    layer('Quote'),
    text(
      '{{quote}}',
      { x: 110, y: 300, width: 860, height: 480 },
      {
        size: 96,
        font: FONT.playfair,
        weight: '700',
        color: '#ffffff',
        lineHeight: 1.15,
        verticalAlign: 'middle',
      },
    ),
    layer('Author'),
    text(
      '— {{author}}',
      { x: 110, y: 830, width: 860, height: 60 },
      {
        size: 40,
        font: FONT.montserrat,
        color: 'rgba(255,255,255,0.85)',
      },
    ),
  ],
};

const eventPoster: DesignTemplate = {
  name: 'event-poster',
  description: 'Event poster: photo behind, date badge, title and place',
  category: 'poster',
  width: 1080,
  height: 1350,
  background: '#111827',
  fonts: [FONTS.anton, FONTS.montserrat],
  fields: {
    photo: { kind: 'image', label: 'Photo' },
    day: { kind: 'text', label: 'Day', default: '24' },
    month: { kind: 'text', label: 'Month', default: 'NOV' },
    title: { kind: 'text', label: 'Title', default: 'LIVE MUSIC NIGHT' },
    details: {
      kind: 'text',
      label: 'Place and time',
      default: 'Blue Note Bar · 9 PM',
    },
    accent: { kind: 'color', label: 'Accent', default: '#f97316' },
  },
  steps: [
    ...photoSlot(
      'photo',
      { x: 0, y: 0, width: 1080, height: 1350 },
      { x: 0, y: 330, width: 1080, height: 300 },
    ),
    layer('Shade'),
    gradient([0, 300], [0, 1350], ['rgba(17,24,39,0.2)', 'rgba(17,24,39,0.9)']),
    layer('Date'),
    rect({ x: 80, y: 80, width: 200, height: 200 }, '{{accent}}', 16),
    text(
      '{{day}}',
      { x: 80, y: 92, width: 200, height: 120 },
      {
        size: 120,
        font: FONT.anton,
        align: 'center',
        verticalAlign: 'middle',
        color: '#ffffff',
      },
    ),
    text(
      '{{month}}',
      { x: 80, y: 208, width: 200, height: 52 },
      {
        size: 40,
        font: FONT.montserrat,
        weight: '700',
        align: 'center',
        color: '#ffffff',
      },
    ),
    layer('Title'),
    text(
      '{{title}}',
      { x: 80, y: 720, width: 920, height: 370 },
      {
        size: 180,
        font: FONT.anton,
        color: '#ffffff',
        lineHeight: 0.95,
        verticalAlign: 'bottom',
      },
    ),
    rect({ x: 80, y: 1115, width: 140, height: 10 }, '{{accent}}'),
    layer('Details'),
    text(
      '{{details}}',
      { x: 80, y: 1150, width: 920, height: 70 },
      {
        size: 48,
        font: FONT.montserrat,
        color: '#ffffff',
      },
    ),
  ],
};

const blogBanner: DesignTemplate = {
  name: 'blog-banner',
  description:
    'Wide banner for a blog post or link preview, photo on the right',
  category: 'banner',
  width: 1200,
  height: 630,
  background: '#0f172a',
  fonts: [FONTS.playfair, FONTS.montserrat],
  fields: {
    photo: { kind: 'image', label: 'Photo' },
    eyebrow: { kind: 'text', label: 'Category', default: 'GUIDE' },
    title: {
      kind: 'text',
      label: 'Title',
      default: 'How to plan the perfect trip',
    },
    byline: { kind: 'text', label: 'Byline', default: 'By Your Name' },
    background: { kind: 'color', label: 'Background', default: '#0f172a' },
    accent: { kind: 'color', label: 'Accent', default: '#38bdf8' },
  },
  steps: [
    background('{{background}}'),
    ...photoSlot('photo', { x: 720, y: 0, width: 480, height: 630 }),
    layer('Text'),
    text(
      '{{eyebrow}}',
      { x: 70, y: 140, width: 600, height: 40 },
      {
        size: 28,
        font: FONT.montserrat,
        weight: '700',
        letterSpacing: 6,
        color: '{{accent}}',
      },
    ),
    text(
      '{{title}}',
      { x: 70, y: 200, width: 600, height: 270 },
      {
        size: 76,
        font: FONT.playfair,
        weight: '700',
        color: '#ffffff',
        lineHeight: 1.1,
      },
    ),
    text(
      '{{byline}}',
      { x: 70, y: 500, width: 600, height: 40 },
      {
        size: 28,
        font: FONT.montserrat,
        color: '#94a3b8',
      },
    ),
  ],
};

export const CARDS_AND_POSTERS = [quoteCard, eventPoster, blogBanner];
