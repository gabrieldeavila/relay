import type { NamedJsonStore } from '../../../named-json-store.js';
import { templateKey } from '../../text-templates/domain/template-name.js';
import { BUILTIN_IMAGE_TEMPLATES } from '../domain/builtin-image-templates.js';
import type {
  ImageTemplate,
  ListedImageTemplate,
} from '../domain/image-template.js';

/** Built-in and saved image templates. */
export function createImageTemplates(store: NamedJsonStore<ImageTemplate>) {
  const isBuiltIn = (name: string) =>
    BUILTIN_IMAGE_TEMPLATES.some((t) => t.name === name);

  async function list(): Promise<ListedImageTemplate[]> {
    const saved = await store.list();
    return [
      ...BUILTIN_IMAGE_TEMPLATES.map((t) => ({ ...t, builtIn: true })),
      ...saved.map((t) => ({ ...t, builtIn: false })),
    ];
  }

  return {
    list,

    async get(name: string): Promise<ImageTemplate> {
      const key = templateKey(name);
      const template = (await list()).find((t) => t.name === key);
      if (!template) {
        throw new Error(
          `No image template "${name}". list_image_templates shows them.`,
        );
      }
      return template;
    },

    async save(template: ImageTemplate): Promise<void> {
      if (isBuiltIn(template.name)) {
        throw new Error(
          `"${template.name}" is a built-in template; save yours under another name.`,
        );
      }
      await store.save(template);
    },

    async remove(name: string): Promise<void> {
      const key = templateKey(name);
      if (isBuiltIn(key)) {
        throw new Error(`"${key}" is built in and can't be deleted.`);
      }
      if (!(await store.remove(key))) {
        throw new Error(`No saved image template "${name}".`);
      }
    },
  };
}

export type ImageTemplates = ReturnType<typeof createImageTemplates>;
