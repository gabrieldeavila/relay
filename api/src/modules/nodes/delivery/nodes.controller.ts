import { Controller, Get } from '@nestjs/common';
import { z } from 'zod';
import { NODES } from '../data/node-catalog.js';

/** Node catalog for the editor palette and its config forms. */
@Controller('nodes')
export class NodesController {
  @Get()
  list() {
    return NODES.map((node) => ({
      type: node.type,
      kind: node.kind,
      title: node.title,
      description: node.description,
      outputPorts: node.outputPorts,
      configSchema: z.toJSONSchema(node.config, { io: 'input' }),
    }));
  }
}
