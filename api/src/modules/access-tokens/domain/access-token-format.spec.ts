import {
  formatAccessToken,
  hashAccessToken,
  looksLikeAccessToken,
  tokenHint,
} from './access-token-format.js';

describe('access tokens', () => {
  const token = formatAccessToken(Buffer.alloc(32, 7));

  it('are recognizable and checked by shape before any lookup', () => {
    expect(token).toMatch(/^relay_/);
    expect(looksLikeAccessToken(token)).toBe(true);
    expect(looksLikeAccessToken('eyJhbGciOi.jwt.token')).toBe(false);
    expect(looksLikeAccessToken(`${token}x`)).toBe(false);
  });

  it('are stored as a stable hash and shown only as a hint', () => {
    expect(hashAccessToken(token)).toBe(hashAccessToken(token));
    expect(hashAccessToken(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(tokenHint(token)).toBe(`${token.slice(0, 10)}…`);
  });
});
