import type { FontStore } from '../../images/data/font-store.js';
import { isFontInstalled } from '../../images/data/font-store.js';
import { installFont } from '../../images/data/install-font.js';
import { BUILTIN_TEXT_TEMPLATES } from '../domain/builtin-text-templates.js';
import { fontToInstall } from '../domain/fonts-to-install.js';
import type { ListedTemplate, TextTemplate } from '../domain/text-template.js';
import { templateKey } from '../domain/template-name.js';
import type { TextTemplateStore } from './text-template-store.js';

/** Built-in and saved text templates; using one installs its font if needed. */
export function createTextTemplates(
  store: TextTemplateStore,
  fonts: FontStore,
) {
  const isBuiltIn = (name: string) =>
    BUILTIN_TEXT_TEMPLATES.some((t) => t.name === name);

  async function list(): Promise<ListedTemplate[]> {
    const saved = await store.list();
    return [
      ...BUILTIN_TEXT_TEMPLATES.map((t) => ({ ...t, builtIn: true })),
      ...saved.map((t) => ({ ...t, builtIn: false })),
    ];
  }

  async function ensureFont(template: TextTemplate) {
    const missing = fontToInstall(template, isFontInstalled);
    if (!missing) return;
    try {
      await installFont(fonts, {
        family: missing.family,
        weights: [missing.weight],
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Template "${template.name}" needs the font "${missing.family}", which could not be downloaded (${reason}). load_font it or pick another template.`,
      );
    }
  }

  return {
    list,

    /** The template, with its font installed and ready to draw. */
    async use(name: string): Promise<TextTemplate> {
      const key = templateKey(name);
      const template = (await list()).find((t) => t.name === key);
      if (!template) {
        throw new Error(
          `No text template "${name}". list_text_templates shows them.`,
        );
      }
      await ensureFont(template);
      return template;
    },

    async save(template: TextTemplate): Promise<void> {
      if (isBuiltIn(template.name)) {
        throw new Error(
          `"${template.name}" is a built-in template; save yours under another name.`,
        );
      }
      await ensureFont(template);
      await store.save(template);
    },

    async remove(name: string): Promise<void> {
      const key = templateKey(name);
      if (isBuiltIn(key)) {
        throw new Error(`"${key}" is built in and can't be deleted.`);
      }
      if (!(await store.remove(key))) {
        throw new Error(`No saved text template "${name}".`);
      }
    },
  };
}

export type TextTemplates = ReturnType<typeof createTextTemplates>;
