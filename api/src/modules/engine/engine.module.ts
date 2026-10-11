import { Module } from '@nestjs/common';
import {
  DEFAULT_ENGINE_CONFIG,
  ENGINE_CONFIG,
  type EngineConfig,
} from './data/engine-config.js';
import { DeadlineSweeper } from './data/deadline-sweeper.js';
import { EventResumer } from './data/event-resumer.js';
import { RunAdvancer } from './data/run-advancer.js';
import { RunCanceller } from './data/run-canceller.js';
import { RunContextReader } from './data/run-context.reader.js';
import { RunReader } from './data/run-reader.js';
import { RunStarter } from './data/run-starter.js';
import { StepExecutor } from './data/step-executor.js';
import { StepQueue } from './data/step-queue.js';
import { VersionGraphs } from './data/version-graphs.js';
import { WorkerLoop } from './data/worker-loop.js';
import { ResumeController } from './delivery/resume.controller.js';
import { RunsController } from './delivery/runs.controller.js';

@Module({
  controllers: [RunsController, ResumeController],
  providers: [
    {
      provide: ENGINE_CONFIG,
      useFactory: (): EngineConfig => ({
        ...DEFAULT_ENGINE_CONFIG,
        enabled: process.env.WORKER_ENABLED !== 'false',
        concurrency: Number(
          process.env.WORKER_CONCURRENCY ?? DEFAULT_ENGINE_CONFIG.concurrency,
        ),
      }),
    },
    VersionGraphs,
    RunContextReader,
    RunReader,
    StepQueue,
    RunAdvancer,
    RunStarter,
    RunCanceller,
    EventResumer,
    DeadlineSweeper,
    StepExecutor,
    WorkerLoop,
  ],
  exports: [
    RunAdvancer,
    RunStarter,
    RunCanceller,
    EventResumer,
    DeadlineSweeper,
    WorkerLoop,
  ],
})
export class EngineModule {}
