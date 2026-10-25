import { Module } from '@nestjs/common';
import { createImageGenerator } from './data/create-image-generator.js';
import { IMAGE_GENERATOR } from './data/image-generator.js';
import { readGenerationConfig } from './domain/generation-config.js';

/** The image AI, when set up in the environment; otherwise null and Relay works without it. */
@Module({
  providers: [
    {
      provide: IMAGE_GENERATOR,
      useFactory: () => {
        const config = readGenerationConfig(process.env);
        return config ? createImageGenerator(config) : null;
      },
    },
  ],
  exports: [IMAGE_GENERATOR],
})
export class GenerationModule {}
