import { randomBytes } from 'node:crypto';

/** Unguessable URL-safe token for secret links (webhooks, resume links). */
export const newSecretToken = () => randomBytes(18).toString('base64url');
