import {
  familyNames,
  isGenericFamily,
} from '../../images/domain/fonts/font-families.js';
import type { TextTemplate } from './text-template.js';

const NAMED_WEIGHTS: Record<string, string> = { normal: '400', bold: '700' };

/**
 * The first family of a template's font list, when it isn't installed yet.
 * Later families are fallbacks (Impact, sans-serif) and aren't downloaded.
 */
export function fontToInstall(
  template: TextTemplate,
  isInstalled: (family: string) => boolean,
): { family: string; weight: string } | null {
  const [family] = familyNames(template.font);
  if (!family || isGenericFamily(family) || isInstalled(family)) return null;
  return {
    family,
    weight: NAMED_WEIGHTS[template.weight] ?? template.weight,
  };
}
