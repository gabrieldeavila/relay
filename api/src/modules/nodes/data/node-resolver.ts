import { Injectable } from '@nestjs/common';
import { AiNode } from '../../ai/data/ai.node.js';
import { EmailNode } from '../../email/data/email.node.js';
import { ToolNodes } from '../../providers/data/tool-nodes.js';
import { TelegramNode } from '../../telegram/data/telegram.node.js';
import type { FindNodeSpec } from '../../workflows/domain/node-spec.js';
import type { NodeDefinition } from '../domain/node-definition.js';
import { toNodeSpec } from '../domain/to-node-spec.js';
import { NODES } from './node-catalog.js';

/**
 * Built-in nodes (including those that use the owner's accounts, like email)
 * plus the tools of the user's connected apps.
 */
@Injectable()
export class NodeResolver {
  private readonly builtIn: Map<string, NodeDefinition>;

  constructor(
    private readonly tools: ToolNodes,
    email: EmailNode,
    telegram: TelegramNode,
    ai: AiNode,
  ) {
    const accountNodes = [email, telegram, ai].map((node) => node.definition);
    this.builtIn = new Map(
      [...NODES, ...accountNodes].map((node) => [node.type, node]),
    );
  }

  async catalogFor(ownerId: string): Promise<NodeDefinition[]> {
    return [...this.builtIn.values(), ...(await this.tools.forOwner(ownerId))];
  }

  async resolve(type: string, ownerId: string) {
    return this.builtIn.get(type) ?? (await this.tools.resolve(type, ownerId));
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
