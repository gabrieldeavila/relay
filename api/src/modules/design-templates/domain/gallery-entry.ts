import type { DesignField, ListedDesignTemplate } from './design-template.js';

/** What the gallery shows of a template (no drawing steps). */
export interface GalleryEntry {
  name: string;
  description: string;
  category: string;
  width: number;
  height: number;
  builtIn: boolean;
  fields: (DesignField & { key: string })[];
}

export function galleryEntry(template: ListedDesignTemplate): GalleryEntry {
  return {
    name: template.name,
    description: template.description,
    category: template.category,
    width: template.width,
    height: template.height,
    builtIn: template.builtIn,
    fields: Object.entries(template.fields).map(([key, field]) => ({
      key,
      ...field,
    })),
  };
}
