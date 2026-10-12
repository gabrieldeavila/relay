import { at, link, type WorkflowTemplate } from '../workflow-template.js';

/** Every Friday the AI reads a spreadsheet and emails you what stands out. */
export const weeklySheetSummary: WorkflowTemplate = {
  id: 'weekly-sheet-summary',
  title: 'Weekly spreadsheet summary',
  description:
    'Every Friday afternoon, AI reads a spreadsheet (sales, expenses, tasks) and emails you a short summary.',
  accounts: ['ai', 'email'],
  nodes: [
    {
      id: 'start',
      type: 'trigger.schedule',
      config: {
        schedule: {
          every: 'week',
          weekdays: ['fri'],
          time: '17:00',
          timezone: 'America/Sao_Paulo',
        },
      },
      position: at(0),
    },
    {
      id: 'sheet',
      type: 'file.read_table',
      config: { path: '', pick: 'first' },
      position: at(1),
    },
    {
      id: 'summary',
      type: 'ai.generate',
      config: {
        prompt:
          'These are the rows of my spreadsheet, as JSON:\n\n{{ steps.sheet.output.rows }}\n\nWrite a short summary: the totals that matter, what changed and anything unusual.',
        instructions:
          'Write in the same language as the spreadsheet. Plain text for an email, no Markdown. At most 10 lines.',
        model: 'claude-opus-5-5',
      },
      position: at(2),
    },
    {
      id: 'send',
      type: 'email.send',
      config: {
        to: '',
        subject: 'Weekly summary',
        text: '{{ steps.summary.output.text }}',
      },
      position: at(3),
    },
  ],
  edges: [
    link('start', 'sheet'),
    link('sheet', 'summary'),
    link('summary', 'send'),
  ],
};
