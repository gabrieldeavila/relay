import type { History } from '../../history/domain/history.js';
import type { DocumentSetup } from '../domain/document/types.js';
import type { LoggedCommand } from './logged-command.js';

/** What is stored for an image document; pixels are rebuilt by replaying `history`. */
export interface SavedImageDocument {
  setup: DocumentSetup;
  history: History<LoggedCommand>;
}
