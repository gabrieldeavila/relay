import { appliedEntries, type History } from '../../history/domain/history.js';
import { applyVideoCommand } from './apply-video-command.js';
import type { LoggedVideoCommand } from './saved-video-project.js';
import type { Timeline, VideoSetup } from './timeline-types.js';
import type { VideoCommand } from './video-command-types.js';

export function replayTimeline(
  setup: VideoSetup,
  commands: VideoCommand[],
): Timeline {
  return commands.reduce(applyVideoCommand, { setup, clips: [] });
}

/** The timeline as of the history cursor (undone steps left out). */
export function timelineOf(
  setup: VideoSetup,
  history: History<LoggedVideoCommand>,
): Timeline {
  const commands = appliedEntries(history).flatMap((entry) => entry.commands);
  return replayTimeline(setup, commands);
}
