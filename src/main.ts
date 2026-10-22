import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { assertSafeToListen, securityMiddleware, securityOptionsFromEnv } from './infrastructure/security/http-security';

async function bootstrap(): Promise<void> {
  const security = securityOptionsFromEnv();
  assertSafeToListen(security);

  const app = await NestFactory.create(AppModule);
  (app.getHttpAdapter().getInstance() as { disable(name: string): void }).disable('x-powered-by');
  app.use(securityMiddleware(security));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableShutdownHooks();
  await app.listen(security.port, security.host);
  const shown = security.host.includes(':') ? `[${security.host}]` : security.host;
  Logger.log(`Forge listening on http://${shown}:${security.port}${security.token ? ' (token required)' : ''}`, 'Bootstrap');
}

void bootstrap();
