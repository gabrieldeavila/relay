/** The parts of `ffprobe -print_format json -show_streams -show_format` Relay reads. */
export interface FfprobeOutput {
  streams?: {
    codec_type?: string;
    width?: number;
    height?: number;
    duration?: string;
    tags?: { rotate?: string };
    side_data_list?: { rotation?: number }[];
  }[];
  format?: { duration?: string; format_name?: string };
}

export interface MediaInfo {
  width: number | null;
  height: number | null;
  durationMs: number | null;
  hasVideo: boolean;
  hasAudio: boolean;
}

/** Size as displayed (phone videos are often stored sideways with a rotation flag). */
export function parseProbe(output: FfprobeOutput, isStill: boolean): MediaInfo {
  const streams = output.streams ?? [];
  const video = streams.find((stream) => stream.codec_type === 'video');
  const hasAudio = streams.some((stream) => stream.codec_type === 'audio');
  const sideways = isSideways(video);
  const width = video?.width ?? null;
  const height = video?.height ?? null;
  return {
    width: sideways ? height : width,
    height: sideways ? width : height,
    durationMs: isStill ? null : durationMs(output, video?.duration),
    hasVideo: Boolean(video) && !isStill,
    hasAudio,
  };
}

function isSideways(video?: NonNullable<FfprobeOutput['streams']>[number]) {
  const rotation = Number(
    video?.side_data_list?.find((data) => data.rotation !== undefined)
      ?.rotation ??
      video?.tags?.rotate ??
      0,
  );
  return Math.abs(rotation) % 180 === 90;
}

function durationMs(output: FfprobeOutput, streamDuration?: string) {
  const seconds = Number(output.format?.duration ?? streamDuration);
  return Number.isFinite(seconds) && seconds > 0
    ? Math.round(seconds * 1000)
    : null;
}
