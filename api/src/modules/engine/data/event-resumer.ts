import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, isNull } from 'drizzle-orm';
import {
  DATABASE,
  type Database,
  type Transaction,
} from '../../../database/database.js';
import { eventInbox, runs, stepRuns } from '../../../database/schema/index.js';
import { findNode } from '../../nodes/data/node-catalog.js';
import { DEFAULT_PORT } from '../../workflows/domain/graph.js';
import { isTerminal } from '../domain/step-status.js';
import { FINISHED_RUNS, RunAdvancer } from './run-advancer.js';
import { VersionGraphs } from './version-graphs.js';

export interface IncomingEvent {
  resumeToken: string;
  nodeId: string;
  action: string | null;
  payload: unknown;
  dedupeKey: string;
}

/**
 * `resumed`: a waiting step took it. `stored`: the step is not waiting yet and
 * will take it when it does. `rejected`: the step did not accept it.
 */
export type DeliveryResult =
  'resumed' | 'stored' | 'duplicate' | 'closed' | 'rejected' | 'not_found';

/** Hands external events to waiting steps through the event inbox. */
@Injectable()
export class EventResumer {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly versions: VersionGraphs,
    private readonly advancer: RunAdvancer,
  ) {}

  deliver(event: IncomingEvent): Promise<DeliveryResult> {
    return this.db.transaction(async (tx) => {
      const [run] = await tx
        .select({ id: runs.id, versionId: runs.versionId, status: runs.status })
        .from(runs)
        .where(eq(runs.resumeToken, event.resumeToken));
      if (!run) return 'not_found';
      const { index } = await this.versions.get(run.versionId);
      if (!index.nodes.has(event.nodeId)) return 'not_found';
      if (FINISHED_RUNS.includes(run.status)) return 'closed';
      if (await this.stepSettled(tx, run.id, event.nodeId)) return 'closed';

      const stored = await tx
        .insert(eventInbox)
        .values({
          runId: run.id,
          nodeId: event.nodeId,
          action: event.action,
          payload: event.payload,
          dedupeKey: event.dedupeKey,
        })
        .onConflictDoNothing()
        .returning({ id: eventInbox.id });
      if (stored.length === 0) return 'duplicate';
      return this.consumeIn(tx, run.id, run.versionId, event.nodeId);
    });
  }

  /** After a step starts waiting: takes an event that arrived before it. */
  deliverPending(runId: string, versionId: string, nodeId: string) {
    return this.db.transaction((tx) =>
      this.consumeIn(tx, runId, versionId, nodeId),
    );
  }

  private async consumeIn(
    tx: Transaction,
    runId: string,
    versionId: string,
    nodeId: string,
  ): Promise<'resumed' | 'stored' | 'rejected'> {
    const [step] = await tx
      .select({ id: stepRuns.id, attempt: stepRuns.attempt })
      .from(stepRuns)
      .where(
        and(
          eq(stepRuns.runId, runId),
          eq(stepRuns.nodeId, nodeId),
          eq(stepRuns.status, 'waiting'),
          eq(stepRuns.waitingFor, 'event'),
        ),
      )
      .for('update');
    if (!step) return 'stored';

    const { index } = await this.versions.get(versionId);
    const definition = findNode(index.nodes.get(nodeId)?.type ?? '');
    const pending = await tx
      .select()
      .from(eventInbox)
      .where(
        and(
          eq(eventInbox.runId, runId),
          eq(eventInbox.nodeId, nodeId),
          isNull(eventInbox.consumedAt),
        ),
      )
      .orderBy(asc(eventInbox.receivedAt))
      .for('update');

    for (const event of pending) {
      await tx
        .update(eventInbox)
        .set({ consumedAt: new Date() })
        .where(eq(eventInbox.id, event.id));
      const result = definition?.onEvent?.({
        action: event.action,
        payload: event.payload,
        receivedAt: event.receivedAt,
      });
      if (!result) continue;

      await this.advancer.settleWaitingIn(
        tx,
        { ...step, runId, versionId },
        {
          status: 'succeeded',
          port: result.port ?? DEFAULT_PORT,
          output: result.output ?? null,
        },
        event.receivedAt,
      );
      return 'resumed';
    }
    return 'rejected';
  }

  private async stepSettled(tx: Transaction, runId: string, nodeId: string) {
    const [step] = await tx
      .select({ status: stepRuns.status })
      .from(stepRuns)
      .where(and(eq(stepRuns.runId, runId), eq(stepRuns.nodeId, nodeId)));
    return step ? isTerminal(step.status) : false;
  }
}
