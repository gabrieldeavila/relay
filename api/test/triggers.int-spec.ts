import { sql } from 'drizzle-orm';
import { edge, EngineHarness, node } from './support/engine-harness';

const MONDAYS_9AM = {
  every: 'week',
  weekdays: ['mon'],
  time: '09:00',
  timezone: 'America/Sao_Paulo',
};

describe('triggers', () => {
  let engine: EngineHarness;

  beforeAll(async () => {
    engine = await EngineHarness.create();
  });
  afterAll(() => engine.close());
  beforeEach(() => engine.reset());

  const flowStartedBy = (trigger: ReturnType<typeof node>) => ({
    nodes: [
      trigger,
      node('log', 'data.set', { fields: { at: '{{ trigger.scheduledFor }}' } }),
    ],
    edges: [edge(trigger.id, 'log')],
  });

  const runCount = async (workflowId: string) => {
    const [{ count }] = await engine.db.execute<{ count: number }>(
      sql`SELECT count(*)::int AS count FROM relay.runs WHERE workflow_id = ${workflowId}`,
    );
    return count;
  };

  describe('schedule', () => {
    it('arms the next slot on publish and fires it exactly once', async () => {
      const workflowId = await engine.publish(
        flowStartedBy(
          node('start', 'trigger.schedule', { schedule: MONDAYS_9AM }),
        ),
      );
      const armed = await engine.describeTrigger(workflowId);
      expect(armed).toMatchObject({ kind: 'schedule' });
      const slot = (armed as { nextFireAt: Date }).nextFireAt;
      expect(slot.getTime()).toBeGreaterThan(Date.now());

      expect(
        await engine.schedules.fireDue(new Date(slot.getTime() - 1_000)),
      ).toBe(0);
      const at = new Date(slot.getTime() + 2_000);
      const [first, second] = await Promise.all([
        engine.schedules.fireDue(at),
        engine.schedules.fireDue(at),
      ]);
      expect(first + second).toBe(1);
      expect(await engine.schedules.fireDue(at)).toBe(0);
      expect(await runCount(workflowId)).toBe(1);

      const next = (await engine.describeTrigger(workflowId)) as {
        nextFireAt: Date;
      };
      expect(next.nextFireAt.getTime() - slot.getTime()).toBe(7 * 86_400_000);

      await engine.worker.drain();
      const [run] = await engine.db.execute<{ id: string }>(
        sql`SELECT id FROM relay.runs WHERE workflow_id = ${workflowId}`,
      );
      expect(
        (await engine.run(run.id)).steps.find((s) => s.nodeId === 'log')
          ?.output,
      ).toEqual({
        at: slot.toISOString(),
      });
    });

    it('catches up once after the machine was off for weeks', async () => {
      const workflowId = await engine.publish(
        flowStartedBy(
          node('start', 'trigger.schedule', { schedule: MONDAYS_9AM }),
        ),
      );
      const { nextFireAt } = (await engine.describeTrigger(workflowId)) as {
        nextFireAt: Date;
      };
      const weeksLater = new Date(
        nextFireAt.getTime() + 3 * 7 * 86_400_000 + 3_600_000,
      );

      expect(await engine.schedules.fireDue(weeksLater)).toBe(1);
      expect(await engine.schedules.fireDue(weeksLater)).toBe(0);
      const after = (await engine.describeTrigger(workflowId)) as {
        nextFireAt: Date;
      };
      expect(after.nextFireAt.getTime()).toBeGreaterThan(weeksLater.getTime());
    });

    it('refuses to publish an invalid schedule', async () => {
      const result = await engine.tryPublish(
        flowStartedBy(
          node('start', 'trigger.schedule', {
            schedule: { every: 'day', time: '25:00' },
          }),
        ),
      );
      expect(result).toMatchObject({
        type: 'invalid',
        issues: [
          { code: 'invalid_config', nodeId: 'start', field: 'schedule' },
        ],
      });
    });
  });

  describe('webhook', () => {
    it('starts a run with the request body, keeping the URL across publishes', async () => {
      const graph = flowStartedBy(node('start', 'trigger.webhook'));
      const workflowId = await engine.publish(graph);
      const { url } = (await engine.describeTrigger(workflowId)) as {
        url: string;
      };
      expect(url).toMatch(/^http:\/\/localhost:4400\/hooks\/[\w-]{20,}$/);

      await engine.publish(graph, workflowId);
      expect(await engine.describeTrigger(workflowId)).toEqual({
        kind: 'webhook',
        url,
      });

      const token = url.split('/').pop()!;
      const { runId } = await engine.triggers.hook(
        token,
        { name: 'Ana' },
        { ref: 'site' },
      );
      expect((await engine.run(runId)).triggerPayload).toEqual({
        body: { name: 'Ana' },
        query: { ref: 'site' },
      });
      await expect(engine.triggers.hook('forged', {}, {})).rejects.toThrow(
        'Unknown webhook',
      );
    });

    it('stops answering once the flow goes back to a manual start', async () => {
      const workflowId = await engine.publish(
        flowStartedBy(node('start', 'trigger.webhook')),
      );
      const { url } = (await engine.describeTrigger(workflowId)) as {
        url: string;
      };

      await engine.publish(
        flowStartedBy(node('start', 'trigger.manual')),
        workflowId,
      );
      expect(await engine.describeTrigger(workflowId)).toEqual({
        kind: 'manual',
      });
      await expect(
        engine.triggers.hook(url.split('/').pop()!, {}, {}),
      ).rejects.toThrow();
    });
  });
});
