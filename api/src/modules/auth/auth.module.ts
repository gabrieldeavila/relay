import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { SupabaseTokenVerifier } from './data/supabase-token.verifier.js';
import { AuthGuard } from './delivery/auth.guard.js';

@Module({
  providers: [
    SupabaseTokenVerifier,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AuthModule {}
