import { ExpressionError } from './expression-error.js';
import { parsePath } from './parse-path.js';
import {
  resolveExpressions,
  type ExpressionContext,
} from './resolve-expressions.js';

const context: ExpressionContext = {
  trigger: { body: { name: 'Ana', tags: ['promo', 'fall'] } },
  run: { id: 'r1', resumeUrl: 'http://localhost:4400/resume/abc' },
  steps: {
    render: {
      output: { url: 'file:///post.png', width: 1080, meta: { a: 1 } },
    },
    'read-row': { output: { quote: 'Keep going' } },
  },
};

const errorOf = (run: () => unknown) => {
  try {
    run();
  } catch (error) {
    return error as ExpressionError;
  }
  throw new Error('expected an ExpressionError');
};

describe('parsePath', () => {
  it('splits dots and list indexes', () => {
    expect(parsePath('trigger.body.tags[1]')).toEqual([
      'trigger',
      'body',
      'tags',
      1,
    ]);
  });

  it.each(['', '.steps', 'steps..x', 'steps.x[a]', 'steps x'])(
    'rejects %j',
    (path) => {
      expect(errorOf(() => parsePath(path)).problem).toBe('syntax');
    },
  );
});

describe('resolveExpressions', () => {
  it('keeps the type of a value used on its own', () => {
    expect(resolveExpressions('{{ steps.render.output.width }}', context)).toBe(
      1080,
    );
    expect(resolveExpressions('{{steps.render.output.meta}}', context)).toEqual(
      {
        a: 1,
      },
    );
  });

  it('writes values into surrounding text', () => {
    expect(
      resolveExpressions(
        'Hi {{ trigger.body.name }}, tags: {{ trigger.body.tags }}',
        context,
      ),
    ).toBe('Hi Ana, tags: ["promo","fall"]');
  });

  it('resolves nested config and node ids with dashes', () => {
    expect(
      resolveExpressions(
        {
          text: '{{ steps.read-row.output.quote }}',
          size: 48,
          layers: ['{{ trigger.body.tags[0] }}'],
        },
        context,
      ),
    ).toEqual({ text: 'Keep going', size: 48, layers: ['promo'] });
  });

  it('names the missing path', () => {
    const error = errorOf(() =>
      resolveExpressions('{{ steps.render.output.height }}', context),
    );
    expect(error.problem).toBe('not_found');
    expect(error.expression).toBe('steps.render.output.height');
  });

  it('links to a waiting step through the run', () => {
    expect(
      resolveExpressions('{{ run.resumeUrl }}/approval/approve', context),
    ).toBe('http://localhost:4400/resume/abc/approval/approve');
  });

  it('only reads trigger, run and steps', () => {
    expect(
      errorOf(() => resolveExpressions('{{ process.env }}', context)).problem,
    ).toBe('unknown_root');
  });

  it('never reaches object internals', () => {
    expect(
      errorOf(() => resolveExpressions('{{ trigger.constructor }}', context))
        .problem,
    ).toBe('not_found');
  });
});
