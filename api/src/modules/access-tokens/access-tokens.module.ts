import { Module } from '@nestjs/common';
import { AccessTokenRepository } from './data/access-token.repository.js';
import { AccessTokensController } from './delivery/access-tokens.controller.js';

@Module({
  controllers: [AccessTokensController],
  providers: [AccessTokenRepository],
  exports: [AccessTokenRepository],
})
export class AccessTokensModule {}
