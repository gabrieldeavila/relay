import { Injectable } from '@nestjs/common';
import { ToolNodes } from '../../providers/data/tool-nodes.js';
import type { FindNodeSpec } from '../../workflows/domain/node-spec.js';
import type { NodeDefinition } from '../domain/node-definition.js';
import { toNodeSpec } from '../domain/to-node-spec.js';
import { findNode, NODES } from './node-catalog.js';

/** Built-in nodes plus the tools of the user's connected apps. */
@Injectable()
export class NodeResolver {
  constructor(private readonly tools: ToolNodes) {}

  async catalogFor(ownerId: string): Promise<NodeDefinition[]> {
    return [...NODES, ...(await this.tools.forOwner(ownerId))];
  }

  async resolve(type: string, ownerId: string) {
    return findNode(type) ?? (await this.tools.resolve(type, ownerId));
  }

  /** Graph validation for this user's publish. */
  async specsFor(ownerId: string): Promise<FindNodeSpec> {
    const specs = new Map(
      (await this.catalogFor(ownerId)).map((node) => [
        node.type,
        toNodeSpec(node),
      ]),
    );
    return (type) => specs.get(type);
  }
}
