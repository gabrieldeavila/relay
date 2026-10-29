import { previewSize } from './preview-size.js';
import { SETUP } from './test-clips.js';

describe('previewSize', () => {
  it('fits the longest side and keeps both sides even', () => {
    expect(previewSize(SETUP)).toEqual({ width: 480, height: 854 });
    expect(previewSize({ ...SETUP, width: 1280, height: 722 })).toEqual({
      width: 854,
      height: 482,
    });
  });

  it('never scales a small video up', () => {
    expect(previewSize({ ...SETUP, width: 640, height: 360 })).toEqual({
      width: 640,
      height: 360,
    });
  });
});
