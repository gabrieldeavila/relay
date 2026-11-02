import { templateKey } from '../../text-templates/domain/template-name.js';
import { BUILTIN_DESIGN_TEMPLATES } from './builtin-design-templates.js';
import { designProblems } from './design-problems.js';
import type { DesignTemplate } from './design-template.js';
import { designSteps, fieldValues } from './fill-design.js';
import { galleryEntry } from './gallery-entry.js';

const card: DesignTemplate = {
  name: 'card',
  description: 'test card',
  category: 'test',
  width: 100,
  height: 100,
  background: '#fff',
  fonts: [],
  fields: {
    title: { kind: 'text', label: 'Title', default: 'Hello' },
    photo: { kind: 'image', label: 'Photo' },
  },
  steps: [
    { tool: 'draw_text', input: { text: 'Say: {{title}}!' } },
    { tool: 'place_image', input: { assetId: '{{photo}}' }, when: 'photo' },
    { tool: 'draw_rect', input: { fill: 'gray' }, unless: 'photo' },
  ],
};

describe('fieldValues', () => {
  it('fills defaults and keeps what was given', () => {
    expect(fieldValues(card, {})).toEqual({ title: 'Hello' });
    expect(fieldValues(card, { title: 'Hi', photo: 'abc' })).toEqual({
      title: 'Hi',
      photo: 'abc',
    });
  });

  it('treats an empty value as not given', () => {
    expect(fieldValues(card, { title: '' })).toEqual({ title: 'Hello' });
  });

  it('names the fields when one is unknown', () => {
    expect(() => fieldValues(card, { subtitle: 'x' })).toThrow(
      /no field subtitle.*title, photo/,
    );
  });
});

describe('designSteps', () => {
  it('shows the placeholder until a photo is given', () => {
    const steps = designSteps(card, { title: 'Hello' });
    expect(steps.map((s) => s.tool)).toEqual(['draw_text', 'draw_rect']);
    expect(steps[0].input).toEqual({ text: 'Say: Hello!' });
  });

  it('places the photo and drops the placeholder when given', () => {
    const steps = designSteps(card, { title: 'Hi', photo: 'asset-1' });
    expect(steps).toEqual([
      { tool: 'draw_text', input: { text: 'Say: Hi!' } },
      { tool: 'place_image', input: { assetId: 'asset-1' } },
    ]);
  });
});

describe('designProblems', () => {
  it('finds undeclared fields and missing defaults', () => {
    const broken: DesignTemplate = {
      ...card,
      fields: { title: { kind: 'text', label: 'Title' } },
    };
    expect(designProblems(broken)).toEqual([
      'Step 2 (place_image): no field "photo"',
      'Step 3 (draw_rect): no field "photo"',
      'Field "title" needs a default',
    ]);
  });
});

describe('built-in design templates', () => {
  it('have unique, stored-form names and no wiring problems', () => {
    const names = BUILTIN_DESIGN_TEMPLATES.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
    for (const template of BUILTIN_DESIGN_TEMPLATES) {
      expect(templateKey(template.name)).toBe(template.name);
      expect(designProblems(template)).toEqual([]);
    }
  });
});

describe('galleryEntry', () => {
  it('lists fields with their keys and leaves out the steps', () => {
    const entry = galleryEntry({ ...card, builtIn: true });
    expect(entry).not.toHaveProperty('steps');
    expect(entry.fields.map((f) => f.key)).toEqual(['title', 'photo']);
  });
});
