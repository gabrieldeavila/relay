import { clipEnd } from './clip-timing.js';
import { seconds } from './render-inputs.js';
import type { Box, Clip, VideoSetup } from './timeline-types.js';

/** Filters that turn a clip's input into a positioned, faded picture stream. */
export function pictureChain(clip: Clip, setup: VideoSetup): string[] {
  const filters = [`setpts=PTS-STARTPTS+${seconds(clip.start)}/TB`];
  if (clip.kind !== 'text') filters.push(...scaleFilters(clip, setup));
  filters.push('format=rgba');
  if (clip.opacity < 1) {
    filters.push(`colorchannelmixer=aa=${seconds(clip.opacity)}`);
  }
  if (clip.fadeIn > 0) {
    filters.push(
      `fade=t=in:st=${seconds(clip.start)}:d=${seconds(clip.fadeIn)}:alpha=1`,
    );
  }
  if (clip.fadeOut > 0) {
    const start = clipEnd(clip) - clip.fadeOut;
    filters.push(
      `fade=t=out:st=${seconds(start)}:d=${seconds(clip.fadeOut)}:alpha=1`,
    );
  }
  return filters;
}

/** Overlay options placing the picture on the frame while the clip is on. */
export function overlayOptions(clip: Clip, setup: VideoSetup): string {
  const area = areaOf(clip, setup);
  const centered = clip.kind !== 'text' && clip.fit === 'contain';
  const x = centered ? `${area.x}+(${area.width}-overlay_w)/2` : `${area.x}`;
  const y = centered ? `${area.y}+(${area.height}-overlay_h)/2` : `${area.y}`;
  const on = `gte(t,${seconds(clip.start)})*lt(t,${seconds(clipEnd(clip))})`;
  return `overlay=x=${x}:y=${y}:eof_action=pass:enable='${on}'`;
}

function scaleFilters(clip: Clip & { fit: string }, setup: VideoSetup) {
  const { width, height } = areaOf(clip, setup);
  if (clip.fit === 'contain') {
    return [
      `scale=${width}:${height}:force_original_aspect_ratio=decrease`,
      'setsar=1',
    ];
  }
  return [
    `scale=${width}:${height}:force_original_aspect_ratio=increase`,
    `crop=${width}:${height}`,
    'setsar=1',
  ];
}

/** The clip's box in whole pixels; the whole frame when it has none. */
function areaOf(clip: Clip, setup: VideoSetup): Box {
  const box = clip.kind === 'text' ? { x: 0, y: 0, ...size(setup) } : clip.box;
  const area = box ?? { x: 0, y: 0, ...size(setup) };
  return {
    x: Math.round(area.x),
    y: Math.round(area.y),
    width: Math.max(1, Math.round(area.width)),
    height: Math.max(1, Math.round(area.height)),
  };
}

const size = (setup: VideoSetup) => ({
  width: setup.width,
  height: setup.height,
});
