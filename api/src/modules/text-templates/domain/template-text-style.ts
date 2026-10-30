import type { TextStyle } from '../../videos/domain/timeline-types.js';
import type { TextTemplate } from './text-template.js';

/** The style fields a template sets, sized for text of `size` pixels. */
export type TemplatedStyle = Pick<
  TextStyle,
  | 'font'
  | 'weight'
  | 'color'
  | 'stroke'
  | 'strokeWidth'
  | 'background'
  | 'letterSpacing'
  | 'lineHeight'
>;

export function templateTextStyle(
  template: TextTemplate,
  size: number,
): TemplatedStyle {
  return {
    font: template.font,
    weight: template.weight,
    color: template.color,
    stroke: template.stroke,
    strokeWidth: template.stroke ? Math.round(size * template.strokeRatio) : 0,
    background: template.background,
    letterSpacing: Math.round(size * template.letterSpacingRatio),
    lineHeight: template.lineHeight,
  };
}

/** The text as the template shows it (uppercase templates shout). */
export function templateText(template: TextTemplate, text: string): string {
  return template.uppercase ? text.toLocaleUpperCase() : text;
}
