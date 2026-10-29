/** Seconds this close to the end count as "at the end". */
const END_MARGIN = 0.1;

/** Where playback begins: at the playhead, or from the top when it's at the end. */
export function playStart(time: number, duration: number): number {
  return time >= duration - END_MARGIN ? 0 : time;
}
