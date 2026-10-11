import { Module } from '@nestjs/common';
import { EngineModule } from '../engine/engine.module.js';
import { DrizzleTriggerRegistry } from './data/drizzle-trigger.registry.js';
import { SchedulePoller } from './data/schedule-poller.js';
import { TriggerReader } from './data/trigger-reader.js';
import { TriggersController } from './delivery/triggers.controller.js';

export const TRIGGER_REGISTRY = 'TRIGGER_REGISTRY';

@Module({
  imports: [EngineModule],
  controllers: [TriggersController],
  providers: [
    { provide: TRIGGER_REGISTRY, useClass: DrizzleTriggerRegistry },
    TriggerReader,
    SchedulePoller,
  ],
  exports: [TRIGGER_REGISTRY, SchedulePoller],
})
export class TriggersModule {}
