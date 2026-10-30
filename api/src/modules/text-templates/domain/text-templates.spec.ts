import { captionLook } from '../../transcription/domain/caption-style.js';
import type {
  TextClip,
  TextStyle,
} from '../../videos/domain/timeline-types.js';
import { BUILTIN_TEXT_TEMPLATES } from './builtin-text-templates.js';
import { fontToInstall } from './fonts-to-install.js';
import { resolveTextStyle } from './resolve-text-style.js';
import { restyleWithTemplate } from './restyle-with-template.js';
import { templateFromStyle } from './template-from-style.js';
import { templateKey } from './template-name.js';
import type { TextTemplate } from './text-template.js';

const pop = BUILTIN_TEXT_TEMPLATES.find((t) => t.name === 'pop')!;
const news = BUILTIN_TEXT_TEMPLATES.find((t) => t.name === 'news')!;

const style = (changes: Partial<TextStyle> = {}): TextStyle => ({
  ...resolveTextStyle(null, {}),
  ...changes,
});

const textClip = (changes: Partial<TextClip> = {}): TextClip => ({
  id: 'clip_2',
  kind: 'text',
  layer: 10,
  start: 0,
  duration: 1,
  fadeIn: 0,
  fadeOut: 0,
  opacity: 1,
  text: 'hello there',
  box: { x: 0, y: 0, width: 100, height: 50 },
  style: style({ size: 50 }),
  highlight: null,
  ...changes,
});

describe('built-in templates', () => {
  it('have unique, stored-form names', () => {
    const names = BUILTIN_TEXT_TEMPLATES.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
    names.forEach((name) => expect(templateKey(name)).toBe(name));
  });
});

describe('templateKey', () => {
  it('lowercases and joins words with dashes', () => {
    expect(templateKey('  My Brand!! ')).toBe('my-brand');
  });

  it('rejects names without letters or digits', () => {
    expect(() => templateKey('!!')).toThrow();
  });
});

describe('resolveTextStyle', () => {
  it('uses the defaults without a template', () => {
    expect(resolveTextStyle(null, {}).font).toBe('sans-serif');
  });

  it('applies the template, sized to the font size', () => {
    const resolved = resolveTextStyle(pop, { size: 100 });
    expect(resolved).toMatchObject({
      font: pop.font,
      weight: '900',
      size: 100,
      strokeWidth: 12,
    });
  });

  it('lets given fields override the template', () => {
    const resolved = resolveTextStyle(pop, {
      color: '#ff0000',
      font: undefined,
    });
    expect(resolved.color).toBe('#ff0000');
    expect(resolved.font).toBe(pop.font);
  });

  it('drops the outline width when the template has no outline', () => {
    expect(resolveTextStyle(news, {}).strokeWidth).toBe(0);
  });
});

describe('restyleWithTemplate', () => {
  it('keeps the size and uppercases for uppercase templates', () => {
    const changes = restyleWithTemplate(textClip(), pop);
    expect(changes.text).toBe('HELLO THERE');
    expect(changes.style).toMatchObject({ font: pop.font, strokeWidth: 6 });
    expect(changes.style).not.toHaveProperty('size');
  });

  it('leaves the text alone for sentence-case templates', () => {
    expect(restyleWithTemplate(textClip(), news)).not.toHaveProperty('text');
  });
});

describe('templateFromStyle', () => {
  it('turns a clip look into ratios of its size', () => {
    const template = templateFromStyle({
      name: 'My Look',
      base: {
        style: style({ size: 80, strokeWidth: 8, letterSpacing: 4 }),
        text: 'LOUD!',
      },
      overrides: {},
    });
    expect(template).toMatchObject({
      name: 'my-look',
      strokeRatio: 0.1,
      letterSpacingRatio: 0.05,
      uppercase: true,
    });
    expect(template.description).toContain('uppercase');
  });

  it('lets given fields win over the clip', () => {
    const template = templateFromStyle({
      name: 'x',
      description: 'mine',
      base: { style: style(), text: 'quiet' },
      overrides: { font: 'Lobster', uppercase: true },
    });
    expect(template).toMatchObject({
      font: 'Lobster',
      uppercase: true,
      description: 'mine',
    });
  });
});

describe('fontToInstall', () => {
  const withFont = (font: string, weight = 'bold'): TextTemplate => ({
    ...pop,
    font,
    weight,
  });

  it('asks for the first family in its weight', () => {
    expect(fontToInstall(withFont('Anton, Impact'), () => false)).toEqual({
      family: 'Anton',
      weight: '700',
    });
  });

  it('skips installed and generic families', () => {
    expect(fontToInstall(withFont('Anton'), () => true)).toBeNull();
    expect(fontToInstall(withFont('sans-serif'), () => false)).toBeNull();
  });
});

describe('captionLook with a template', () => {
  const setup = { width: 1080, height: 1920, fps: 30, background: '#000' };

  it('uses the template instead of the style preset', () => {
    const look = captionLook(setup, {
      style: 'bold',
      template: news,
      position: 'lower',
    });
    expect(look.uppercase).toBe(false);
    expect(look.style).toMatchObject({
      font: news.font,
      background: news.background,
    });
  });

  it('keeps an explicit font over the template', () => {
    const look = captionLook(setup, {
      style: 'bold',
      template: pop,
      position: 'lower',
      font: 'Lobster',
    });
    expect(look.style.font).toBe('Lobster');
  });
});
