import { z } from 'zod';
import { FOLDER_TRIGGER } from '../../triggers/domain/trigger-registration.js';
import { defineNode } from '../domain/node-definition.js';
import { done } from '../domain/node-result.js';

/**
 * Files already in the folder when the flow is published are left alone.
 * Output: `{ name, path, folder, bytes, modifiedAt }` of the new file.
 */
export const folderTriggerNode = defineNode({
  type: FOLDER_TRIGGER,
  kind: 'trigger',
  title: 'When a file appears in a folder',
  description:
    'Runs once for each new file saved in a folder on this computer.',
  config: z.object({
    folder: z.string().min(1),
    pattern: z.string().default('*'),
  }),
  outputPorts: ['out'],
  run: () => Promise.resolve(done(null)),
});
