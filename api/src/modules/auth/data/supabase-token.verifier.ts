import { Injectable } from '@nestjs/common';
import {
  createRemoteJWKSet,
  decodeProtectedHeader,
  jwtVerify,
  type JWTVerifyGetKey,
} from 'jose';

/**
 * Verifies access tokens from the local Supabase Auth. Older CLIs sign with
 * the shared JWT secret (HS256); newer ones with keys published as JWKS.
 */
@Injectable()
export class SupabaseTokenVerifier {
  private jwks?: JWTVerifyGetKey;

  /** The user id (`sub`), or null when the token is missing, bad or expired. */
  async userId(token: string): Promise<string | null> {
    try {
      const { alg } = decodeProtectedHeader(token);
      const { payload } =
        alg === 'HS256'
          ? await jwtVerify(token, sharedSecret(), { algorithms: ['HS256'] })
          : await jwtVerify(token, this.keySet());
      return payload.role === 'authenticated' && payload.sub
        ? payload.sub
        : null;
    } catch {
      return null;
    }
  }

  private keySet() {
    this.jwks ??= createRemoteJWKSet(
      new URL(`${supabaseUrl()}/auth/v1/.well-known/jwks.json`),
    );
    return this.jwks;
  }
}

function sharedSecret() {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) throw new Error('SUPABASE_JWT_SECRET is not set');
  return new TextEncoder().encode(secret);
}

function supabaseUrl() {
  return (process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321').replace(
    /\/$/,
    '',
  );
}
