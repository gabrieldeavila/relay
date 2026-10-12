import type { CatalogEntry } from '../../nodes/domain/to-catalog-entry.js';
import type { NodeSpec } from '../../workflows/domain/node-spec.js';
import { blockingIssues, checkPlan } from './check-plan.js';
import { describeIssue } from './describe-issue.js';
import { draftFlow } from './draft-flow.js';
import { findBadReferences } from './find-bad-references.js';
import { layoutSteps } from './layout-steps.js';
import { readPlanAnswer } from './plan-answer.js';
import { graphToPlan, planToGraph } from './plan-to-graph.js';

const entry = (
  type: string,
  kind: 'trigger' | 'action',
  properties: Record<string, unknown> = {},
  required: string[] = [],
  ports = ['out'],
): CatalogEntry => ({
  type,
  kind,
  title: type,
  description: '',
  group: null,
  outputPorts: ports,
  output: null,
  configSchema: { type: 'object', properties, required },
  requiredConfig: required,
});

const CATALOG = [
  entry('trigger.manual', 'trigger'),
  entry(
    'telegram.send',
    'action',
    { text: {}, chatId: {} },
    ['text'],
    ['out', 'error'],
  ),
  entry(
    'flow.approval',
    'action',
    { question: {} },
    [],
    ['approved', 'rejected'],
  ),
];
const specs = new Map<string, NodeSpec>(
  CATALOG.map((e) => [
    e.type,
    {
      type: e.type,
      kind: e.kind,
      outputPorts: e.outputPorts,
      requiredConfig: e.requiredConfig,
    },
  ]),
);
const findSpec = (type: string) => specs.get(type);

const goodPlan = {
  steps: [
    { id: 'start', type: 'trigger.manual', config: {} },
    { id: 'ask', type: 'flow.approval', config: { question: 'Send?' } },
    {
      id: 'send',
      type: 'telegram.send',
      config: { text: 'Approved: {{ steps.ask.output.decision }}', chatId: '' },
    },
  ],
  links: [
    { from: 'start', to: 'ask' },
    { from: 'ask', to: 'send', port: 'approved' },
  ],
};

describe('layoutSteps', () => {
  it('puts each step one column after what leads to it, branches below', () => {
    const positions = layoutSteps(
      ['a', 'b', 'c', 'd'],
      [
        { from: 'a', to: 'b' },
        { from: 'a', to: 'c' },
        { from: 'b', to: 'd' },
        { from: 'c', to: 'd' },
      ],
    );
    expect(Object.fromEntries(positions)).toEqual({
      a: { x: 0, y: 0 },
      b: { x: 300, y: 0 },
      c: { x: 300, y: 160 },
      d: { x: 600, y: 0 },
    });
  });

  it('ends even when links loop', () => {
    const positions = layoutSteps(
      ['a', 'b'],
      [
        { from: 'a', to: 'b' },
        { from: 'b', to: 'a' },
      ],
    );
    expect(positions.size).toBe(2);
  });
});

describe('planToGraph / graphToPlan', () => {
  it('adds ids and default ports, and round-trips', () => {
    const graph = planToGraph(goodPlan);
    expect(graph.edges).toEqual([
      {
        id: 'start.out->ask',
        source: 'start',
        sourcePort: 'out',
        target: 'ask',
      },
      {
        id: 'ask.approved->send',
        source: 'ask',
        sourcePort: 'approved',
        target: 'send',
      },
    ]);
    expect(graphToPlan(graph)).toEqual(goodPlan);
  });

  it('keeps the place of steps already on the canvas', () => {
    const previous = planToGraph(goodPlan);
    previous.nodes[1].position = { x: 50, y: 900 };
    const graph = planToGraph(goodPlan, previous);
    expect(graph.nodes[1].position).toEqual({ x: 50, y: 900 });
    expect(graph.nodes[2].position).toEqual({ x: 600, y: 0 });
  });
});

describe('checkPlan', () => {
  it('lets blanks through but flags them', () => {
    const graph = planToGraph({
      ...goodPlan,
      steps: goodPlan.steps.map((s) =>
        s.id === 'send' ? { ...s, config: { text: '' } } : s,
      ),
    });
    const issues = checkPlan(graph, CATALOG, findSpec);
    expect(issues).toEqual([
      { code: 'missing_config', nodeId: 'send', field: 'text' },
    ]);
    expect(blockingIssues(issues)).toEqual([]);
  });

  it('flags settings the type does not have and values that cannot resolve', () => {
    const graph = planToGraph({
      ...goodPlan,
      steps: goodPlan.steps.map((s) =>
        s.id === 'send'
          ? {
              ...s,
              config: { text: '{{ steps.draw.output.url }}', message: 'x' },
            }
          : s,
      ),
    });
    expect(checkPlan(graph, CATALOG, findSpec)).toEqual([
      { code: 'unknown_config', nodeId: 'send', field: 'message' },
      { code: 'bad_reference', nodeId: 'send', field: 'steps.draw.output.url' },
    ]);
  });
});

describe('findBadReferences', () => {
  it('accepts trigger, run links and steps of the flow', () => {
    const graph = planToGraph({
      steps: [
        {
          id: 'a',
          type: 't',
          config: {
            ok: '{{ trigger.x }} {{ run.link }} {{ steps.a.output }}',
            list: ['{{ run.resumeUrl }}', { deep: '{{ env.HOME }}' }],
            bad: '{{ run.secret }}',
          },
        },
      ],
      links: [],
    });
    expect(findBadReferences(graph).map((r) => r.expression)).toEqual([
      'env.HOME',
      'run.secret',
    ]);
  });
});

describe('readPlanAnswer', () => {
  const answer = (steps: unknown[], links: unknown[] = []) =>
    JSON.stringify({ name: 'Weekly', summary: 'Does it.', steps, links });

  it('parses each step’s settings from its JSON string', () => {
    expect(
      readPlanAnswer(
        answer(
          [{ id: 'start', type: 'trigger.manual', configJson: '{"a":1}' }],
          [{ from: 'start', to: 'x', port: '' }],
        ),
      ),
    ).toEqual({
      ok: true,
      name: 'Weekly',
      summary: 'Does it.',
      plan: {
        steps: [{ id: 'start', type: 'trigger.manual', config: { a: 1 } }],
        links: [{ from: 'start', to: 'x' }],
      },
    });
  });

  it('says what to fix in a broken answer', () => {
    expect(readPlanAnswer('nope')).toEqual({
      ok: false,
      problems: ['The answer was not valid JSON.'],
    });
    const broken = readPlanAnswer(
      answer([{ id: 'has space', type: 't', configJson: '[1]' }]),
    );
    expect(broken.ok).toBe(false);
    expect(!broken.ok && broken.problems.join(' ')).toMatch(
      /configJson is not a JSON object[\s\S]*Step ids/,
    );
  });
});

describe('describeIssue', () => {
  it('reads as a sentence that names the step', () => {
    expect(
      describeIssue({ code: 'invalid_port', edgeId: 'a.out->b', field: 'yes' }),
    ).toMatch(/Link "a.out->b" leaves through "yes"/);
    expect(describeIssue({ code: 'no_trigger' })).toMatch(/one trigger/);
  });
});

describe('draftFlow', () => {
  const asJson = (plan: typeof goodPlan) =>
    JSON.stringify({
      name: 'Approve and send',
      summary: 'Asks, then sends.',
      steps: plan.steps.map(({ id, type, config }) => ({
        id,
        type,
        configJson: JSON.stringify(config),
      })),
      links: plan.links.map((link) => ({ port: 'out', ...link })),
    });
  const check = (graph: ReturnType<typeof planToGraph>) =>
    checkPlan(graph, CATALOG, findSpec);

  it('sends problems back until the draft is clean', async () => {
    const wrongPort = {
      ...goodPlan,
      links: [goodPlan.links[0], { from: 'ask', to: 'send', port: 'yes' }],
    };
    const answers = ['not json', asJson(wrongPort), asJson(goodPlan)];
    const asked: (string[] | null)[] = [];
    const result = await draftFlow({
      ask: (problems) => {
        asked.push(problems);
        return Promise.resolve(answers.shift()!);
      },
      check,
    });
    expect(result).toMatchObject({
      ok: true,
      name: 'Approve and send',
      issues: [],
    });
    expect(asked[0]).toBeNull();
    expect(asked[1]).toEqual(['The answer was not valid JSON.']);
    expect(asked[2]?.join(' ')).toMatch(/leaves through "yes"/);
  });

  it('keeps the best draft when the rounds run out', async () => {
    const twoProblems = {
      ...goodPlan,
      links: [{ from: 'ask', to: 'send', port: 'nope' }],
    };
    const oneProblem = { ...goodPlan, links: [goodPlan.links[1]] };
    const answers = [asJson(twoProblems), asJson(oneProblem), 'x'];
    const result = await draftFlow({
      ask: () => Promise.resolve(answers.shift()!),
      check,
    });
    expect(result.ok && result.issues).toEqual([
      { code: 'unreachable_node', nodeId: 'ask' },
      { code: 'unreachable_node', nodeId: 'send' },
    ]);
  });

  it('fails with the last problems when no answer was usable', async () => {
    const result = await draftFlow(
      { ask: () => Promise.resolve('x'), check },
      2,
    );
    expect(result).toEqual({
      ok: false,
      problems: ['The answer was not valid JSON.'],
    });
  });
});
