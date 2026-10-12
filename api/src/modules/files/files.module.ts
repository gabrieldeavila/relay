import { Module } from '@nestjs/common';
import { RunFileStore } from './data/run-file-store.js';
import { FilesController } from './delivery/files.controller.js';

@Module({
  controllers: [FilesController],
  providers: [RunFileStore],
  exports: [RunFileStore],
})
export class FilesModule {}
