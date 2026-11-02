import type { NamedJsonStore } from '../../../named-json-store.js';
import { templateKey } from '../../text-templates/domain/template-name.js';
import { BUILTIN_DESIGN_TEMPLATES } from '../domain/builtin-design-templates.js';
import type {
  DesignTemplate,
  ListedDesignTemplate,
} from '../domain/design-template.js';

/** Built-in and saved design templates. */
export function createDesignTemplateRegistry(
  store: NamedJsonStore<DesignTemplate>,
) {
  const isBuiltIn = (name: string) =>
    BUILTIN_DESIGN_TEMPLATES.some((t) => t.name === name);

  async function list(): Promise<ListedDesignTemplate[]> {
    const saved = await store.list();
    return [
      ...BUILTIN_DESIGN_TEMPLATES.map((t) => ({ ...t, builtIn: true })),
      ...saved.map((t) => ({ ...t, builtIn: false })),
    ];
  }

  return {
    list,

    async get(name: string): Promise<ListedDesignTemplate> {
      const key = templateKey(name);
      const template = (await list()).find((t) => t.name === key);
      if (!template) {
        throw new Error(
          `No design template "${name}". list_design_templates shows them.`,
        );
      }
      return template;
    },

    async save(template: DesignTemplate): Promise<void> {
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
        throw new Error(`No saved design template "${name}".`);
      }
    },
  };
}

export type DesignTemplateRegistry = ReturnType<
  typeof createDesignTemplateRegistry
>;
