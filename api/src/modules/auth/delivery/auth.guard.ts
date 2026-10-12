import {
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseTokenVerifier } from '../data/supabase-token.verifier.js';
import type { AuthenticatedRequest } from './current-user.decorator.js';
import { IS_PUBLIC } from './public.decorator.js';

/** Every route needs a logged-in user unless marked `@Public()`. */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly verifier: SupabaseTokenVerifier,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    const userId = token && (await this.verifier.userId(token));
    if (!userId) throw new UnauthorizedException('Log in to continue');
    request.userId = userId;
    return true;
  }
}
