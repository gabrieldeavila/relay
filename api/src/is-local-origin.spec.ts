import { isLocalOrigin } from './is-local-origin.js';

describe('isLocalOrigin', () => {
  it('accepts this machine on any port', () => {
    expect(isLocalOrigin('http://localhost:5400')).toBe(true);
    expect(isLocalOrigin('http://127.0.0.1:5401')).toBe(true);
    expect(isLocalOrigin('http://[::1]:3000')).toBe(true);
  });

  it('refuses other sites and junk', () => {
    expect(isLocalOrigin('https://evil.example')).toBe(false);
    expect(isLocalOrigin('http://localhost.evil.example')).toBe(false);
    expect(isLocalOrigin('file://localhost')).toBe(false);
    expect(isLocalOrigin('not a url')).toBe(false);
  });
});
