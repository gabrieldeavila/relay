/** Base of links Relay hands out (webhooks, resume links). Local by default. */
export const publicUrl = () =>
  (process.env.PUBLIC_URL ?? 'http://localhost:4400').replace(/\/$/, '');
