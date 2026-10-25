import { Injectable } from '@nestjs/common';
import { isUuid } from '../../../is-uuid.js';
import {
  createChangeFeed,
  type ChangeFeed,
} from '../../history/data/change-feed.js';
import { createSerialQueue } from '../../history/data/serial-queue.js';
import {
  emptyHistory,
  pushEntry,
  redo,
  undo,
  type History,
} from '../../history/domain/history.js';
import { applyVideoCommand } from '../domain/apply-video-command.js';
import { assertValidSetup } from '../domain/check-clip.js';
import { timelineOf } from '../domain/replay-timeline.js';
import type { LoggedVideoCommand } from '../domain/saved-video-project.js';
import type { Timeline, VideoSetup } from '../domain/timeline-types.js';
import type { VideoCommand } from '../domain/video-command-types.js';
import { VideoProjectsRepository } from './video-projects.repository.js';

/** Decides the commands of one edit from the current timeline (e.g. picks new clip ids). */
export type EditPlan = (
  timeline: Timeline,
) => VideoCommand[] | Promise<VideoCommand[]>;

/** Video projects: edits run one at a time per project and are saved as history. */
@Injectable()
export class VideoProjects {
  private readonly queues = new Map<
    string,
    ReturnType<typeof createSerialQueue>
  >();
  private readonly feeds = new Map<string, ChangeFeed>();

  constructor(private readonly repository: VideoProjectsRepository) {}

  async create(name: string, setup: VideoSetup) {
    assertValidSetup(setup);
    const row = await this.repository.create(name, {
      setup,
      history: emptyHistory(),
    });
    return row.id;
  }

  list() {
    return this.repository.list();
  }

  async get(id: string) {
    const row = isUuid(id) ? await this.repository.find(id) : null;
    if (!row) throw new Error(`No video with id ${id}. Use list_videos.`);
    return { ...row, timeline: timelineOf(row.setup, row.history) };
  }

  /**
   * Applies an edit as one undo step. Nothing is kept if a command fails or
   * `check` rejects the resulting timeline.
   */
  edit(
    id: string,
    label: string,
    plan: EditPlan,
    check: (timeline: Timeline) => Promise<void> = async () => {},
  ): Promise<Timeline> {
    return this.queueOf(id)(async () => {
      const project = await this.get(id);
      const commands = await plan(project.timeline);
      const timeline = commands.reduce(applyVideoCommand, project.timeline);
      await check(timeline);
      const entry = { label, commands, at: new Date().toISOString() };
      await this.saveHistory(
        id,
        project.setup,
        pushEntry(project.history, entry),
      );
      return timeline;
    });
  }

  undo(id: string) {
    return this.moveCursor(id, undo);
  }

  redo(id: string) {
    return this.moveCursor(id, redo);
  }

  changes(id: string): ChangeFeed {
    let feed = this.feeds.get(id);
    if (!feed) this.feeds.set(id, (feed = createChangeFeed()));
    return feed;
  }

  private moveCursor(id: string, move: typeof undo): Promise<boolean> {
    return this.queueOf(id)(async () => {
      const project = await this.get(id);
      const history = move(project.history);
      if (history === project.history) return false;
      await this.saveHistory(id, project.setup, history);
      return true;
    });
  }

  private async saveHistory(
    id: string,
    setup: VideoSetup,
    history: History<LoggedVideoCommand>,
  ) {
    await this.repository.save(id, { setup, history });
    this.changes(id).publish({ version: Date.now(), reason: 'edit' });
  }

  private queueOf(id: string) {
    let queue = this.queues.get(id);
    if (!queue) this.queues.set(id, (queue = createSerialQueue()));
    return queue;
  }
}
