import type { WorkflowTemplate } from '../workflow-template.js';
import { folderToEmail } from './folder-to-email.js';
import { quoteOfTheWeek } from './quote-of-the-week.js';
import { weeklySheetSummary } from './weekly-sheet-summary.js';

export const TEMPLATES: readonly WorkflowTemplate[] = [
  quoteOfTheWeek,
  folderToEmail,
  weeklySheetSummary,
];

export const findTemplate = (id: string) =>
  TEMPLATES.find((template) => template.id === id);
