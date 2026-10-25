import { Module } from '@nestjs/common';
import { AssetRepository } from './data/asset.repository.js';
import { AssetStore } from './data/asset-store.js';
import { AssetsController } from './delivery/assets.controller.js';

@Module({
  controllers: [AssetsController],
  providers: [AssetRepository, AssetStore],
  exports: [AssetStore],
})
export class AssetsModule {}
