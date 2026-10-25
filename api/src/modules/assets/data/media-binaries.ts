/** ffmpeg/ffprobe from PATH unless set (e.g. FFMPEG_PATH=/opt/homebrew/bin/ffmpeg). */
export const ffmpegPath = () => process.env.FFMPEG_PATH ?? 'ffmpeg';
export const ffprobePath = () => process.env.FFPROBE_PATH ?? 'ffprobe';
