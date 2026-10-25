import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { orNotFound } from '../../../http/or-not-found.js';
import { publicUrl } from '../../../public-url.js';
import { AssetStore } from '../data/asset-store.js';
import type { AssetKind } from '../domain/asset.js';
import { describeAsset } from '../domain/describe-asset.js';

@Controller('assets')
export class AssetsController {
  constructor(private readonly store: AssetStore) {}

  @Get()
  async list(@Query('kind') kind?: AssetKind) {
    const assets = await this.store.list(kind, 200);
    return assets.map((asset) => describeAsset(asset, publicUrl()));
  }

  @Get(':id/file')
  async file(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const asset = await orNotFound(this.store.get(id));
    // The default folder is `.data/`: send() refuses dot folders unless told.
    res.sendFile(asset.path, { dotfiles: 'allow' });
  }
}
