import { Body, Controller, Get, Post } from '@nestjs/common';
import { IsBoolean } from 'class-validator';
import { ExecutionWorker } from './execution.worker';

class IntakeDto {
  @IsBoolean()
  paused!: boolean;
}

/** Drain mode for safe restarts (admin only, see access-policy). */
@Controller('system/intake')
export class IntakeController {
  constructor(private readonly worker: ExecutionWorker) {}

  @Get()
  async status() {
    const active = await this.worker.activeWork();
    return { paused: this.worker.isIntakePaused, ...active, safeToRestart: active.running === 0 && active.evaluating === 0 };
  }

  @Post()
  async set(@Body() dto: IntakeDto) {
    this.worker.pauseIntake(dto.paused);
    return this.status();
  }
}
