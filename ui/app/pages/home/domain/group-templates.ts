import type { DesignTemplateEntry, TemplateGroup } from "./design-template";

/** Templates grouped by category, in the order categories first appear. */
export function groupTemplates(
  templates: DesignTemplateEntry[],
): TemplateGroup[] {
  const groups = new Map<string, DesignTemplateEntry[]>();
  for (const template of templates) {
    const group = groups.get(template.category) ?? [];
    group.push(template);
    groups.set(template.category, group);
  }
  return [...groups].map(([category, entries]) => ({
    category,
    templates: entries,
  }));
}

/** "bold-announcement" → "Bold announcement". */
export function humanize(key: string): string {
  const words = key.replace(/[-_]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
