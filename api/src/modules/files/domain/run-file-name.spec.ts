import { isSafeFileName, runFileName } from './run-file-name.js';

describe('run files', () => {
  it('names one file per step attempt', () => {
    expect(runFileName('render_image', 2, 'image/png')).toBe(
      'render_image-2.png',
    );
    expect(runFileName('photo', 1, 'application/pdf')).toBe('photo-1.bin');
  });

  it('refuses names that could leave the run folder', () => {
    expect(() => runFileName('../x', 1, 'image/png')).toThrow();
    expect(isSafeFileName('render-1.png')).toBe(true);
    expect(isSafeFileName('../../etc/passwd')).toBe(false);
    expect(isSafeFileName('a/b.png')).toBe(false);
  });
});
