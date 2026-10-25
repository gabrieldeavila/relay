/** Base of links Relay hands out (asset files). Local by default. */
export const publicUrl = () =>
  (process.env.PUBLIC_URL ?? 'http://localhost:4400').replace(/\/$/, '');
