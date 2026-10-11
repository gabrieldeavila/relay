import { evaluateCondition } from './evaluate-condition.js';

describe('evaluateCondition', () => {
  it('treats numbers written as text as numbers', () => {
    expect(evaluateCondition('10', 'equals', 10)).toBe(true);
    expect(evaluateCondition('10.0', 'equals', '10')).toBe(true);
    expect(evaluateCondition('9', 'greater_than', '10')).toBe(false);
  });

  it('compares text exactly for equality', () => {
    expect(evaluateCondition('Ana', 'equals', 'Ana')).toBe(true);
    expect(evaluateCondition('Ana', 'not_equals', 'ana')).toBe(true);
  });

  it('looks inside text and lists for contains', () => {
    expect(evaluateCondition('Big SALE today', 'contains', 'sale')).toBe(true);
    expect(evaluateCondition(['a', 2], 'contains', '2')).toBe(true);
    expect(evaluateCondition(['a'], 'contains', 'b')).toBe(false);
  });

  it('never orders non-numbers', () => {
    expect(evaluateCondition('abc', 'greater_than', 1)).toBe(false);
    expect(evaluateCondition('abc', 'less_than', 1)).toBe(false);
  });

  it.each([null, undefined, '', '  ', [], {}])('%j is empty', (value) => {
    expect(evaluateCondition(value, 'is_empty')).toBe(true);
  });

  it.each([0, false, 'x', [0], { a: 1 }])('%j is not empty', (value) => {
    expect(evaluateCondition(value, 'is_not_empty')).toBe(true);
  });
});
