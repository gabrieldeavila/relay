import type { ListedDesignTemplate } from './design-template.js';

/** A template as list_design_templates shows it: what it is, then its fields. */
export function describeDesign(template: ListedDesignTemplate): string {
  const origin = template.builtIn ? 'built-in' : 'saved';
  const fields = Object.entries(template.fields).map(([key, field]) => {
    const value = field.default ? ` = "${field.default}"` : '';
    return `  ${key} (${field.kind}, ${field.label})${value}`;
  });
  return [
    `${template.name} — ${template.category} ${template.width}x${template.height}, ${origin}: ${template.description}`,
    ...fields,
  ].join('\n');
}
