import {
  createNamedJsonStore,
  type NamedJsonStore,
} from '../../../named-json-store.js';
import type { TextTemplate } from '../domain/text-template.js';

/** Text templates the person saved, kept in one JSON file. */
export function createTextTemplateStore(path: string) {
  return createNamedJsonStore<TextTemplate>(path);
}

export type TextTemplateStore = NamedJsonStore<TextTemplate>;
