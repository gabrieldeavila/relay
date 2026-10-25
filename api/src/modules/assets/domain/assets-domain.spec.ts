import { assetRef, parseAssetRef } from './asset-ref.js';
import { extensionFor, extensionOf, mediaTypeOf } from './media-types.js';
import { parseProbe } from './parse-probe.js';

const ID = '3f2c8a4e-1b7d-4c2a-9e8f-0a1b2c3d4e5f';

describe('media types', () => {
  it('knows images, videos and audio by extension', () => {
    expect(mediaTypeOf('/a/Clip.MOV')).toEqual({
      mimeType: 'video/quicktime',
      kind: 'video',
    });
    expect(mediaTypeOf('song.mp3')?.kind).toBe('audio');
    expect(mediaTypeOf('photo.jpeg')?.mimeType).toBe('image/jpeg');
    expect(mediaTypeOf('notes.txt')).toBeNull();
    expect(mediaTypeOf('no-extension')).toBeNull();
  });

  it('maps content types back to an extension', () => {
    expect(extensionFor('image/jpeg; charset=binary')).toBe('jpg');
    expect(extensionFor('video/mp4')).toBe('mp4');
    expect(extensionFor('text/html')).toBeNull();
    expect(extensionOf('a.tar.GZ')).toBe('gz');
  });
});

describe('asset refs', () => {
  it('round-trips an id and rejects anything else', () => {
    expect(parseAssetRef(assetRef(ID))).toBe(ID);
    expect(parseAssetRef('asset:../../etc')).toBeNull();
    expect(parseAssetRef('data:image/png;base64,AAAA')).toBeNull();
  });
});

describe('parseProbe', () => {
  it('reads size, duration and audio of a video', () => {
    expect(
      parseProbe(
        {
          streams: [
            { codec_type: 'video', width: 1920, height: 1080 },
            { codec_type: 'audio' },
          ],
          format: { duration: '12.345' },
        },
        false,
      ),
    ).toEqual({
      width: 1920,
      height: 1080,
      durationMs: 12345,
      hasVideo: true,
      hasAudio: true,
    });
  });

  it('swaps width and height for rotated phone videos', () => {
    const info = parseProbe(
      {
        streams: [
          {
            codec_type: 'video',
            width: 1920,
            height: 1080,
            side_data_list: [{ rotation: -90 }],
          },
        ],
        format: { duration: '3' },
      },
      false,
    );
    expect([info.width, info.height]).toEqual([1080, 1920]);
  });

  it('gives stills no duration and audio files no size', () => {
    const still = parseProbe(
      {
        streams: [{ codec_type: 'video', width: 10, height: 20 }],
        format: { duration: '0.04' },
      },
      true,
    );
    expect(still).toMatchObject({ durationMs: null, hasVideo: false });
    const audio = parseProbe(
      { streams: [{ codec_type: 'audio' }], format: { duration: '2.5' } },
      false,
    );
    expect(audio).toMatchObject({
      width: null,
      durationMs: 2500,
      hasAudio: true,
    });
  });
});
