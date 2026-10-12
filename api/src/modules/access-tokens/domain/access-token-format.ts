import { createHash } from 'node:crypto';

const PREFIX = 'relay_';
const SHAPE = /^relay_[A-Za-z0-9_-]{43}$/;

/** `relay_` + 32 random bytes in base64url: easy to spot if pasted somewhere. */
export const formatAccessToken = (random: Buffer) =>
  `${PREFIX}${random.toString('base64url')}`;

export const looksLikeAccessToken = (value: string) => SHAPE.test(value);

/** Tokens are long and random, so a plain SHA-256 is enough to store them. */
export const hashAccessToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

/** `relay_AbC1…`: enough to tell tokens apart, useless to an attacker. */
export const tokenHint = (token: string) =>
  `${token.slice(0, PREFIX.length + 4)}…`;
