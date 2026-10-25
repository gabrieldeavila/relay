import { Module } from '@nestjs/common';
import { AssetsModule } from '../assets/assets.module.js';
import { ImageDocuments } from './data/image-documents.js';
import { ImageDocumentsRepository } from './data/image-documents.repository.js';
import { ImagesController } from './delivery/images.controller.js';

@Module({
  imports: [AssetsModule],
  controllers: [ImagesController],
  providers: [ImageDocumentsRepository, ImageDocuments],
  exports: [ImageDocuments],
})
export class ImagesModule {}
