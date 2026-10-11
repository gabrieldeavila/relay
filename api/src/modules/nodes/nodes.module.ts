import { Module } from '@nestjs/common';
import { NodesController } from './delivery/nodes.controller.js';

@Module({ controllers: [NodesController] })
export class NodesModule {}
