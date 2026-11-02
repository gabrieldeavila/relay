import { Module } from '@nestjs/common';
import { ImagesModule } from '../images/images.module.js';
import { DesignTemplates } from './data/design-templates.service.js';
import { DesignTemplatesController } from './delivery/design-templates.controller.js';

@Module({
  imports: [ImagesModule],
  controllers: [DesignTemplatesController],
  providers: [DesignTemplates],
  exports: [DesignTemplates],
})
export class DesignTemplatesModule {}
