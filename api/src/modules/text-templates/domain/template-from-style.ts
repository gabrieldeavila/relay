import type { TextStyle } from '../../videos/domain/timeline-types.js';
import type { TextTemplate } from './text-template.js';
import { templateKey } from './template-name.js';

/** Fields that can be given directly when saving a template. */
export type TemplateOverrides = Partial<
  Pick<
    TextTemplate,
    'font' | 'weight' | 'color' | 'stroke' | 'background' | 'uppercase'
  >
>;

export interface TemplateSource {
  name: string;
  description?: string;
  /** A text clip's look to start from. */
  base?: { style: TextStyle; text: string };
  overrides: TemplateOverrides;
}

const BLANK: Omit<TextTemplate, 'name' | 'description'> = {
  font: 'sans-serif',
  weight: 'bold',
  color: '#ffffff',
  stroke: '#000000',
  strokeRatio: 0.06,
  background: null,
  uppercase: false,
  letterSpacingRatio: 0,
  lineHeight: 1.15,
};

/** A template from a clip's look and/or given fields. */
export function templateFromStyle(source: TemplateSource): TextTemplate {
  const look = source.base
    ? lookOf(source.base.style, source.base.text)
    : BLANK;
  const merged = { ...look, ...source.overrides };
  return {
    ...merged,
    name: templateKey(source.name),
    description: source.description ?? describeLook(merged),
  };
}

function lookOf(
  style: TextStyle,
  text: string,
): Omit<TextTemplate, 'name' | 'description'> {
  return {
    font: style.font,
    weight: style.weight,
    color: style.color,
    stroke: style.stroke,
    strokeRatio: ratio(style.strokeWidth, style.size),
    background: style.background,
    uppercase: isAllCaps(text),
    letterSpacingRatio: ratio(style.letterSpacing, style.size),
    lineHeight: style.lineHeight,
  };
}

function ratio(value: number, size: number): number {
  return size > 0 ? Number((value / size).toFixed(3)) : 0;
}

function isAllCaps(text: string): boolean {
  return /\p{L}/u.test(text) && text === text.toLocaleUpperCase();
}

function describeLook(look: Omit<TextTemplate, 'name' | 'description'>) {
  const parts = [look.font, look.weight, look.color];
  if (look.uppercase) parts.push('uppercase');
  if (look.stroke) parts.push(`${look.stroke} outline`);
  if (look.background) parts.push(`on ${look.background}`);
  return parts.join(', ');
}
