import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AccessGuard } from './access.guard';

/** Accounts, roles per company and sessions; the access guard covers every route. */
@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthService, { provide: APP_GUARD, useClass: AccessGuard }],
  exports: [AuthService],
})
export class AuthModule {}
