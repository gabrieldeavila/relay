import type { History } from '../../history/domain/history.js';
import type { VideoSetup } from './timeline-types.js';
import type { VideoCommand } from './video-command-types.js';

/** One undo step: a single command, or several from a batch. */
export interface LoggedVideoCommand {
  label: string;
  commands: VideoCommand[];
  at: string;
}

/** What is stored for a video project; the timeline is rebuilt by replaying `history`. */
export interface SavedVideoProject {
  setup: VideoSetup;
  history: History<LoggedVideoCommand>;
}
