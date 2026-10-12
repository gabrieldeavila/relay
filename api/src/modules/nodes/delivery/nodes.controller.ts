import { Controller, Get } from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser } from '../../auth/delivery/current-user.decorator.js';
import { NodeResolver } from '../data/node-resolver.js';

/** Node catalog for the editor palette and its config forms. */
@Controller('nodes')
export class NodesController {
  constructor(private readonly resolver: NodeResolver) {}

  @Get()
  async list(@CurrentUser() userId: string) {
    return (await this.resolver.catalogFor(userId)).map((node) => ({
      type: node.type,
      kind: node.kind,
      title: node.title,
      description: node.description,
      group: node.group ?? null,
      outputPorts: node.outputPorts,
      configSchema:
        node.configJsonSchema ?? z.toJSONSchema(node.config, { io: 'input' }),
    }));
  }
}
