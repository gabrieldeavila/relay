import { Module } from '@nestjs/common';
import { HealthController } from './delivery/health.controller.js';

@Module({ controllers: [HealthController] })
export class HealthModule {}
