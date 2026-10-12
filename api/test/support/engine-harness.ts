import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { sql } from 'drizzle-orm';
import { AppModule } from '../../src/app.module';
import { DATABASE, type Database } from '../../src/database/database';
import { DeadlineSweeper } from '../../src/modules/engine/data/deadline-sweeper';
import { EventResumer } from '../../src/modules/engine/data/event-resumer';
import { RunAdvancer } from '../../src/modules/engine/data/run-advancer';
import { RunCanceller } from '../../src/modules/engine/data/run-canceller';
import { RunReader } from '../../src/modules/engine/data/run-reader';
import { RunRetrier } from '../../src/modules/engine/data/run-retrier';
import { RunStarter } from '../../src/modules/engine/data/run-starter';
import { StepQueue } from '../../src/modules/engine/data/step-queue';
import { WorkerLoop } from '../../src/modules/engine/data/worker-loop';
import { SchedulePoller } from '../../src/modules/triggers/data/schedule-poller';
import { TriggersController } from '../../src/modules/triggers/delivery/triggers.controller';
import { WORKFLOW_REPOSITORY } from '../../src/modules/workflows/delivery/workflows.controller';
import type {
  GraphEdge,
  GraphNode,
  WorkflowGraph,
} from '../../src/modules/workflows/domain/graph';
import { PublishWorkflow } from '../../src/modules/workflows/domain/publish-workflow';
import type { WorkflowRepository } from '../../src/modules/workflows/domain/workflow';
import { TEST_DATABASE_URL } from './test-database-url';

export const node = (
  id: string,
  type: string,
  config: Record<string, unknown> = {},
): GraphNode => ({ id, type, config, position: { x: 0, y: 0 } });

export const edge = (
  source: string,
  target: string,
  sourcePort = 'out',
): GraphEdge => ({
  id: `${source}.${sourcePort}->${target}`,
  source,
  sourcePort,
  target,
});

/** Every workflow in the tests belongs to this user. */
export const TEST_OWNER = '00000000-0000-4000-8000-000000000001';

type RunView = NonNullable<Awaited<ReturnType<RunReader['get']>>>;

/** The real app on `relay_test`, with the worker driven by the test. */
export class EngineHarness {
  private constructor(private readonly module: TestingModule) {}

  static async create() {
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    process.env.WORKER_ENABLED = 'false';
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    await module.init();
    return new EngineHarness(module);
  }

  get db() {
    return this.module.get<Database>(DATABASE);
  }
  get queue() {
    return this.module.get(StepQueue);
  }
  get advancer() {
    return this.module.get(RunAdvancer);
  }
  get worker() {
    return this.module.get(WorkerLoop);
  }
  get starter() {
    return this.module.get(RunStarter);
  }
  get canceller() {
    return this.module.get(RunCanceller);
  }
  get retrier() {
    return this.module.get(RunRetrier);
  }
  /** Any provider of the app, for specs that need one directly. */
  get<T>(type: new (...args: never[]) => T): T {
    return this.module.get(type);
  }
  get resumer() {
    return this.module.get(EventResumer);
  }
  get deadlines() {
    return this.module.get(DeadlineSweeper);
  }
  get schedules() {
    return this.module.get(SchedulePoller);
  }
  get triggers() {
    return this.module.get(TriggersController);
  }

  get workflows() {
    return this.module.get<WorkflowRepository>(WORKFLOW_REPOSITORY);
  }

  /** The workflow's trigger as its owner sees it. */
  describeTrigger(workflowId: string) {
    return this.triggers.describe(TEST_OWNER, workflowId);
  }

  async reset() {
    await this.db.execute(sql`DELETE FROM relay.workflows`);
  }

  async publish(graph: WorkflowGraph, workflowId?: string): Promise<string> {
    const result = await this.tryPublish(graph, workflowId);
    if (result.type !== 'published') {
      throw new Error(`Not published: ${JSON.stringify(result)}`);
    }
    return result.workflowId;
  }

  /** Saves the graph as the draft (of a new workflow by default) and publishes. */
  async tryPublish(graph: WorkflowGraph, workflowId?: string) {
    const repository = this.module.get<WorkflowRepository>(WORKFLOW_REPOSITORY);
    const id =
      workflowId ?? (await repository.create(TEST_OWNER, 'Test flow')).id;
    await repository.update(id, TEST_OWNER, { draftGraph: graph });
    const result = await this.module
      .get(PublishWorkflow)
      .execute(id, TEST_OWNER);
    return { ...result, workflowId: id };
  }

  async start(workflowId: string, payload: unknown = {}) {
    const runId = await this.starter.startRun(workflowId, payload);
    if (!runId) throw new Error('Run did not start');
    return runId;
  }

  /** Moves every event-wait deadline into the past. */
  async passDeadlines() {
    await this.db.execute(sql`
      UPDATE relay.step_runs SET deadline_at = now() - interval '1 second'
      WHERE deadline_at IS NOT NULL`);
  }

  /** Brings retries and sleeps forward instead of waiting for them. */
  async makeDue() {
    await this.db.execute(sql`
      UPDATE relay.step_runs SET run_at = now()
      WHERE status IN ('retrying', 'waiting')`);
  }

  async run(runId: string): Promise<RunView> {
    const run = await this.module.get(RunReader).get(runId, TEST_OWNER);
    if (!run) throw new Error(`Run ${runId} not found`);
    return run;
  }

  async statuses(runId: string) {
    const { status, steps } = await this.run(runId);
    return {
      run: status,
      steps: Object.fromEntries(
        steps.map((step) => [step.nodeId, step.status]),
      ),
    };
  }

  close() {
    return this.module.close();
  }
}
