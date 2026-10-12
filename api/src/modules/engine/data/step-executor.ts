import { Inject, Injectable } from '@nestjs/common';
import { NodeResolver } from '../../nodes/data/node-resolver.js';
import type { NodeDefinition } from '../../nodes/domain/node-definition.js';
import { StepFailure } from '../../nodes/domain/step-failure.js';
import { applyNodeResult } from '../domain/apply-node-result.js';
import { decideFailure } from '../domain/decide-failure.js';
import { resolveExpressions } from '../domain/expressions/resolve-expressions.js';
import { DEFAULT_RETRY_POLICY } from '../domain/retry-policy.js';
import type { StepChange } from '../domain/step-change.js';
import { AttemptTimeout, raceAbort } from './attempt-timeout.js';
import { ENGINE_CONFIG, type EngineConfig } from './engine-config.js';
import { EventResumer } from './event-resumer.js';
import { RunAdvancer } from './run-advancer.js';
import { RunContextReader } from './run-context.reader.js';
import type { ClaimedStep } from './step-queue.js';
import { StepQueue } from './step-queue.js';
import { toStepError } from './to-step-error.js';
import { VersionGraphs, type VersionGraph } from './version-graphs.js';

/** Runs one attempt of a claimed step and records how it ended. */
@Injectable()
export class StepExecutor {
  constructor(
    @Inject(ENGINE_CONFIG) private readonly config: EngineConfig,
    private readonly versions: VersionGraphs,
    private readonly contexts: RunContextReader,
    private readonly queue: StepQueue,
    private readonly advancer: RunAdvancer,
    private readonly resumer: EventResumer,
    private readonly nodes: NodeResolver,
  ) {}

  async execute(step: ClaimedStep, shutdown: AbortSignal): Promise<void> {
    const startedAt = new Date();
    const version = await this.versions.get(step.versionId);
    const change = await this.attempt(step, version, shutdown);
    // Shutting down: leave it running; the reaper hands it to the next worker.
    if (shutdown.aborted) return;
    const kept = await this.advancer.finish(step, change, startedAt);
    if (kept && change.status === 'waiting' && change.waitingFor === 'event') {
      await this.resumer.deliverPending(
        step.runId,
        step.versionId,
        step.nodeId,
      );
    }
  }

  private async attempt(
    step: ClaimedStep,
    { index, trigger }: VersionGraph,
    shutdown: AbortSignal,
  ): Promise<StepChange> {
    const node = index.nodes.get(step.nodeId);
    const definition =
      node && (await this.nodes.resolve(node.type, step.ownerId));
    const policy = { ...DEFAULT_RETRY_POLICY, ...definition?.retry };
    const timeoutMs = definition?.timeoutMs ?? this.config.defaultTimeoutMs;
    const timeout = new AbortController();
    const timer = setTimeout(
      () => timeout.abort(new AttemptTimeout(timeoutMs)),
      timeoutMs,
    );
    const stopHeartbeat = this.keepLease(step, timeout);
    let input: unknown;

    try {
      if (!node || !definition) throw unknownNode(step.nodeId);
      if (step.attempt > policy.maxAttempts) throw interrupted(step.attempt);

      const context = await this.contexts.read(step.runId, trigger.id);
      input = resolveExpressions(node.config, context);
      const result = await this.run(definition, input, step, {
        signal: AbortSignal.any([timeout.signal, shutdown]),
      });
      return applyNodeResult(result, input);
    } catch (thrown) {
      const error = toStepError(thrown);
      const decision = decideFailure({
        attempt: step.attempt,
        error,
        policy,
        connectedPorts: (index.outgoing.get(step.nodeId) ?? []).map(
          (edge) => edge.sourcePort,
        ),
        now: new Date(),
      });
      return { ...decision, error, input };
    } finally {
      clearTimeout(timer);
      stopHeartbeat();
    }
  }

  private run(
    definition: NodeDefinition,
    input: unknown,
    step: ClaimedStep,
    { signal }: { signal: AbortSignal },
  ) {
    const config = definition.config.parse(input);
    const work = definition.run(config, {
      signal,
      step: { runId: step.runId, nodeId: step.nodeId, attempt: step.attempt },
      idempotencyKey: `${step.runId}:${step.nodeId}:${step.attempt}`,
      attempt: step.attempt,
      resumed: step.previousStatus === 'waiting',
      now: () => new Date(),
    });
    return raceAbort(work, signal);
  }

  /** Renews the lease while the attempt runs; aborts it if the lease is lost. */
  private keepLease(step: ClaimedStep, attempt: AbortController) {
    const { leaseMs } = this.config;
    const timer = setInterval(() => {
      this.queue.renewLease(step, leaseMs).then(
        (kept) => kept || attempt.abort(new Error('Lease lost')),
        () => undefined,
      );
    }, leaseMs / 3);
    return () => clearInterval(timer);
  }
}

function unknownNode(nodeId: string) {
  return new StepFailure({
    kind: 'invalid',
    message: `Step ${nodeId} uses a node type that no longer exists`,
  });
}

function interrupted(attempt: number) {
  return new StepFailure({
    kind: 'unknown',
    message: `Stopped after being interrupted ${attempt - 1} times`,
  });
}
