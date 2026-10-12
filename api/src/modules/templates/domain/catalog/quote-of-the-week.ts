import {
  at,
  link,
  PINCEL,
  type WorkflowTemplate,
} from '../workflow-template.js';

const pincel = (tool: string) => ({ app: PINCEL, tool });
const quote = '{{ steps.quotes.output.row.quote }}';
const author = '{{ steps.quotes.output.row.author }}';
const picture = '{{ steps.render.output.image.path }}';

/**
 * Every Monday: next quote from a spreadsheet (columns `quote`, `author`),
 * drawn in Pincel, sent to you for approval, then posted.
 */
export const quoteOfTheWeek: WorkflowTemplate = {
  id: 'quote-of-the-week',
  title: 'Quote of the week',
  description:
    'Every Monday, draws the next quote from your spreadsheet in Pincel, asks you to approve it on Telegram, then posts it.',
  accounts: ['telegram'],
  nodes: [
    {
      id: 'start',
      type: 'trigger.schedule',
      config: {
        schedule: {
          every: 'week',
          weekdays: ['mon'],
          time: '09:00',
          timezone: 'America/Sao_Paulo',
        },
      },
      position: at(0),
    },
    {
      id: 'quotes',
      type: 'file.read_table',
      config: { path: '', pick: 'weekly' },
      position: at(1),
    },
    {
      id: 'canvas',
      type: pincel('create_document'),
      config: { width: 1080, height: 1080, background: '#1f2937' },
      position: at(2),
    },
    {
      id: 'quote',
      type: pincel('draw_text'),
      config: {
        text: `“${quote}”`,
        box: { x: 100, y: 160, width: 880, height: 600 },
        fit: 'shrink',
        size: 88,
        minSize: 32,
        lineHeight: 1.25,
        font: 'Georgia, serif',
        color: '#f9fafb',
        align: 'center',
        verticalAlign: 'middle',
      },
      position: at(3),
    },
    {
      id: 'author',
      type: pincel('draw_text'),
      config: {
        text: `— ${author}`,
        position: [540, 840],
        size: 40,
        color: '#fbbf24',
        align: 'center',
      },
      position: at(4),
    },
    {
      id: 'render',
      type: pincel('render_image'),
      config: { maxSize: 1080 },
      position: at(5),
    },
    {
      id: 'preview',
      type: 'telegram.send',
      config: {
        image: picture,
        text: 'This week’s post is ready. Approve or reject it here: {{ run.link }}',
        chatId: '',
      },
      position: at(6),
    },
    {
      id: 'approval',
      type: 'flow.approval',
      config: {
        question: 'Post this week’s quote?',
        timeoutAmount: 2,
        timeoutUnit: 'days',
      },
      position: at(7),
    },
    {
      id: 'post',
      type: 'telegram.send',
      config: { image: picture, text: `“${quote}” — ${author}`, chatId: '' },
      position: at(8),
    },
  ],
  edges: [
    link('start', 'quotes'),
    link('quotes', 'canvas'),
    link('canvas', 'quote'),
    link('quote', 'author'),
    link('author', 'render'),
    link('render', 'preview'),
    link('preview', 'approval'),
    link('approval', 'post', 'approved'),
  ],
};
