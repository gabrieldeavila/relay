import { buildFfmpegArgs } from './build-ffmpeg-args.js';
import { image, INPUTS, media, text, timeline } from './test-clips.js';

describe('buildFfmpegArgs', () => {
  const graphOf = (args: string[]) =>
    args[args.indexOf('-filter_complex') + 1].split(';');

  it('overlays clips by layer over the background and mixes audio', () => {
    const args = buildFfmpegArgs(
      timeline(text(), image(), media({ start: 1, volume: 0.5, fadeOut: 1 })),
      INPUTS,
      { kind: 'video', path: '/out.mp4' },
    );
    expect(args.slice(4, 8)).toEqual([
      '-f',
      'lavfi',
      '-i',
      'color=c=0x000000:s=1080x1920:r=30:d=6',
    ]);
    expect(args).toEqual(
      expect.arrayContaining(['-ss', '2', '-t', '5', '-i', '/a.mp4']),
    );
    expect(args).toEqual(
      expect.arrayContaining([
        '-loop',
        '1',
        '-framerate',
        '30',
        '-t',
        '3',
        '-i',
        '/logo.png',
      ]),
    );
    expect(graphOf(args)).toEqual([
      '[1:v]setpts=PTS-STARTPTS+1/TB,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,format=rgba,fade=t=out:st=5:d=1:alpha=1[p0]',
      "[0:v][p0]overlay=x=0:y=0:eof_action=pass:enable='gte(t,1)*lt(t,6)'[o0]",
      '[1:a]asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo,volume=0.5,afade=t=out:st=4:d=1,adelay=delays=1000:all=1[a0]',
      '[2:v]setpts=PTS-STARTPTS+1/TB,scale=200:100:force_original_aspect_ratio=decrease,setsar=1,format=rgba[p1]',
      "[o0][p1]overlay=x=40+(200-overlay_w)/2:y=40+(100-overlay_h)/2:eof_action=pass:enable='gte(t,1)*lt(t,4)'[o1]",
      '[3:v]setpts=PTS-STARTPTS+0/TB,format=rgba[p2]',
      "[o1][p2]overlay=x=0:y=0:eof_action=pass:enable='gte(t,0)*lt(t,2)'[o2]",
      '[o2]format=yuv420p[vout]',
      '[a0]anull[aout]',
    ]);
    expect(args.slice(-20)).toEqual(
      [
        '-map',
        '[vout]',
        '-map',
        '[aout]',
        '-c:a',
        'aac',
        '-b:a',
        '192k',
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        '-crf',
        '20',
        '-pix_fmt',
        'yuv420p',
        '-r',
        '30',
        '-t',
        '6',
        '-movflags',
        '+faststart',
        '/out.mp4',
      ].slice(-20),
    );
  });

  it('mixes several sounds, skips muted ones and audio-only pictures', () => {
    const args = buildFfmpegArgs(
      timeline(
        media(),
        media({ id: 'clip_5', assetId: 'song', in: 0, out: 30 }),
        media({ id: 'clip_6', start: 5, volume: 0 }),
      ),
      INPUTS,
      { kind: 'video', path: '/out.mp4' },
    );
    const graph = graphOf(args);
    expect(graph.filter((f) => f.includes('overlay'))).toHaveLength(2);
    expect(graph.at(-1)).toBe(
      '[a0][a1]amix=inputs=2:duration=longest:normalize=0[aout]',
    );
  });

  it('renders a single PNG frame without audio, even of an empty moment', () => {
    const args = buildFfmpegArgs(timeline(), INPUTS, {
      kind: 'frame',
      path: '/f.png',
    });
    expect(args).toContain('color=c=0x000000:s=1080x1920:r=30:d=0.033');
    expect(args.slice(-5)).toEqual([
      '-frames:v',
      '1',
      '-update',
      '1',
      '/f.png',
    ]);
    expect(args).not.toContain('[aout]');
    expect(() =>
      buildFfmpegArgs(timeline(), INPUTS, { kind: 'video', path: '/o.mp4' }),
    ).toThrow('empty');
  });
});
