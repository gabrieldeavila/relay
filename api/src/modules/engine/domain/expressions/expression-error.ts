export type ExpressionProblem = 'syntax' | 'unknown_root' | 'not_found';

/** Carries the expression text so the UI can say exactly what is missing. */
export class ExpressionError extends Error {
  constructor(
    readonly expression: string,
    readonly problem: ExpressionProblem,
  ) {
    super(`Cannot resolve {{ ${expression} }}: ${problem.replace('_', ' ')}`);
  }
}
