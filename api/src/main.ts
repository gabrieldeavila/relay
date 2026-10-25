import './load-env.js';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { uiUrl } from './ui-url.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Closes MCP sessions and the database cleanly on Ctrl+C.
  app.enableShutdownHooks();

  app.enableCors({
    origin: [uiUrl()],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Local only: never listen on public interfaces.
  await app.listen(process.env.PORT ?? 4400, '127.0.0.1');
}
void bootstrap();
