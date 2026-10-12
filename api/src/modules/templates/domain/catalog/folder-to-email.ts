import { at, link, type WorkflowTemplate } from '../workflow-template.js';

/** Each new PDF saved in a folder is emailed to you as an attachment. */
export const folderToEmail: WorkflowTemplate = {
  id: 'folder-to-email',
  title: 'Email new files from a folder',
  description:
    'When a PDF is saved in a folder (scans, invoices, exports), emails it to you as an attachment.',
  accounts: ['email'],
  nodes: [
    {
      id: 'start',
      type: 'trigger.folder',
      config: { folder: '', pattern: '*.pdf' },
      position: at(0),
    },
    {
      id: 'send',
      type: 'email.send',
      config: {
        to: '',
        subject: 'New file: {{ trigger.name }}',
        text: '{{ trigger.name }} was saved in {{ trigger.folder }}.',
        attachment: '{{ trigger.path }}',
      },
      position: at(1),
    },
  ],
  edges: [link('start', 'send')],
};
