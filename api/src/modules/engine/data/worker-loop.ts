import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { DeadlineSweeper } from './deadline-sweeper.js';
import { ENGINE_CONFIG, type EngineConfig } from './engine-config.js';
import { StepExecutor } from './step-executor.js';
import { StepQueue } from './step-queue.js';

/**
 * Polls the queue and runs up to `concurrency` steps; on the side, reclaims
 * lost steps and expires event waits past their deadline.
 */
@Injectable()
export class WorkerLoop
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(WorkerLoop.name);
  private readonly shutdown = new AbortController();
  private readonly active = new Set<Promise<void>>();
  private pollTimer?: NodeJS.Timeout;
  private maintenanceTimer?: NodeJS.Timeout;

  constructor(
    @Inject(ENGINE_CONFIG) private readonly config: EngineConfig,
    private readonly queue: StepQueue,
    private readonly executor: StepExecutor,
    private readonly deadlines: DeadlineSweeper,
  ) {}

  onApplicationBootstrap() {
    if (!this.config.enabled) return;
    this.schedulePoll(0);
    this.maintenanceTimer = setInterval(
      () => void this.maintain(),
      this.config.maintenanceMs,
    );
  }

  async onApplicationShutdown() {
    clearTimeout(this.pollTimer);
    clearInterval(this.maintenanceTimer);
    this.shutdown.abort();
    await Promise.allSettled(this.active);
  }

  /** Runs due steps until none are left. For tests and one-off scripts. */
  async drain() {
    for (;;) {
      const claimed = await this.pollOnce();
      await Promise.allSettled(this.active);
      if (claimed === 0) return;
    }
  }

  async reap() {
    try {
      const reclaimed = await this.queue.reclaimExpired();
      if (reclaimed) this.logger.warn(`Reclaimed ${reclaimed} abandoned steps`);
    } catch (error) {
      this.logger.error('Reaper failed', error);
    }
  }

  private async maintain() {
    await this.reap();
    try {
      await this.deadlines.expireDue();
    } catch (error) {
      this.logger.error('Deadline sweep failed', error);
    }
  }

  private schedulePoll(delayMs: number) {
    this.pollTimer = setTimeout(() => {
      void this.pollOnce()
        .catch((error) => {
          this.logger.error('Poll failed', error);
          return 0;
        })
        .then((claimed) => {
          if (this.shutdown.signal.aborted) return;
          this.schedulePoll(claimed > 0 ? 0 : this.config.pollMs);
        });
    }, delayMs);
  }

  private async pollOnce(): Promise<number> {
    const free = this.config.concurrency - this.active.size;
    if (free <= 0) return 0;
    const steps = await this.queue.claim(free, this.config.leaseMs);
    for (const step of steps) {
      this.track(this.executor.execute(step, this.shutdown.signal));
    }
    return steps.length;
  }

  /** A crash here leaves the step leased; the reaper retries it later. */
  private track(work: Promise<void>) {
    const tracked: Promise<void> = work
      .catch((error) => this.logger.error('Step execution failed', error))
      .finally(() => this.active.delete(tracked));
    this.active.add(tracked);
  }
}
