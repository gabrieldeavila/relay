import './load-env.js';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { isLocalOrigin } from './is-local-origin.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Closes MCP sessions and the database cleanly on Ctrl+C.
  app.enableShutdownHooks();

  // The UI may run on any local port (Vite picks the next free one).
  app.enableCors({
    origin: (
      origin: string | undefined,
      allow: (error: Error | null, allowed: boolean) => void,
    ) => allow(null, !origin || isLocalOrigin(origin)),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Local only: never listen on public interfaces.
  await app.listen(process.env.PORT ?? 4400, '127.0.0.1');
}
void bootstrap();
