/** What a node returns from one attempt. */
export type NodeResult =
  | { type: 'done'; output: unknown; port?: string }
  /** Park the step until `until`; it runs again with `resumed: true`. */
  | { type: 'sleep'; until: Date }
  /** Park the step until an event arrives (see `onEvent`) or `deadline` passes. */
  | { type: 'wait'; deadline?: Date };

export const done = (output: unknown, port?: string): NodeResult => ({
  type: 'done',
  output,
  port,
});

export const sleepUntil = (until: Date): NodeResult => ({
  type: 'sleep',
  until,
});

export const waitForEvent = (deadline?: Date): NodeResult => ({
  type: 'wait',
  deadline,
});
