import './load-env.js';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Lets the worker loop finish or hand back its steps on Ctrl+C.
  app.enableShutdownHooks();

  app.enableCors({
    origin: [process.env.UI_URL ?? 'http://localhost:5400'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Local only: never listen on public interfaces.
  await app.listen(process.env.PORT ?? 4400, '127.0.0.1');
}
void bootstrap();
