import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../../auth/delivery/current-user.decorator.js';
import { NodeResolver } from '../data/node-resolver.js';
import { toCatalogEntry } from '../domain/to-catalog-entry.js';

/** Node catalog for the editor palette and its config forms. */
@Controller('nodes')
export class NodesController {
  constructor(private readonly resolver: NodeResolver) {}

  @Get()
  async list(@CurrentUser() userId: string) {
    return (await this.resolver.catalogFor(userId)).map(toCatalogEntry);
  }
}
