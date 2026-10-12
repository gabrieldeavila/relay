import { Injectable } from '@nestjs/common';
import { RunFileStore } from '../../files/data/run-file-store.js';
import type { NodeDefinition } from '../../nodes/domain/node-definition.js';
import { SerialPerKey } from '../domain/serial-per-key.js';
import { parseToolNodeType } from '../domain/tool-node-type.js';
import {
  ProviderRepository,
  type ToolProvider,
} from './drizzle-provider.repository.js';
import { toolNode } from './tool-node.factory.js';
import { ToolCaller } from './tool-caller.js';

/** Nodes for every tool of a user's providers, built once per catalog version. */
@Injectable()
export class ToolNodes {
  private readonly serial = new SerialPerKey();
  private readonly built = new Map<string, NodeDefinition[]>();

  constructor(
    private readonly providers: ProviderRepository,
    private readonly caller: ToolCaller,
    private readonly files: RunFileStore,
  ) {}

  async forOwner(ownerId: string): Promise<NodeDefinition[]> {
    const providers = await this.providers.list(ownerId);
    return providers.flatMap((provider) => this.nodesOf(provider));
  }

  /** Only the owner's own providers resolve; anyone else's type is unknown. */
  async resolve(type: string, ownerId: string) {
    const ref = parseToolNodeType(type);
    if (!ref) return undefined;
    const provider = await this.providers.find(ref.providerId, ownerId);
    return provider
      ? this.nodesOf(provider).find((node) => node.type === type)
      : undefined;
  }

  private nodesOf(provider: ToolProvider): NodeDefinition[] {
    const key = `${provider.id}@${provider.refreshedAt.toISOString()}`;
    let nodes = this.built.get(key);
    if (!nodes) {
      for (const stale of this.built.keys()) {
        if (stale.startsWith(`${provider.id}@`)) this.built.delete(stale);
      }
      const deps = {
        caller: this.caller,
        files: this.files,
        serial: this.serial,
      };
      nodes = provider.tools.map((tool) => toolNode(provider, tool, deps));
      this.built.set(key, nodes);
    }
    return nodes;
  }
}
