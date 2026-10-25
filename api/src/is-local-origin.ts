/** Pages served from this machine (any port), e.g. the UI at localhost:5400 or 127.0.0.1:5401. */
export function isLocalOrigin(origin: string): boolean {
  try {
    const { protocol, hostname } = new URL(origin);
    return (
      (protocol === 'http:' || protocol === 'https:') &&
      ['localhost', '127.0.0.1', '[::1]'].includes(hostname)
    );
  } catch {
    return false;
  }
}
