import { BadRequestException, Body, Controller, Delete, Get, Post } from '@nestjs/common';
import { IsInt, Max, Min } from 'class-validator';
import { UsageLimits, fallbackSelection } from '../modules/runtimes/usage-limits';

class DrillDto {
  @IsInt()
  @Min(1)
  @Max(120)
  minutes!: number;
}

const CLAUDE = 'claude_code';

/**
 * Fallback drill (admin only): makes Forge treat Claude as being at its usage limit for a few
 * minutes, so the switch to the fallback endpoint (e.g. OmniRoute) can be proven on the live system.
 * Work goes back to Claude when the drill ends or is cancelled.
 */
@Controller('system/fallback-drill')
export class FallbackDrillController {
  constructor(private readonly usageLimits: UsageLimits) {}

  @Get()
  status() {
    const until = this.usageLimits.blockedUntil(CLAUDE);
    const fallback = fallbackSelection(CLAUDE);
    return { claudeLimitedUntil: until ? new Date(until).toISOString() : null, fallback: fallback ? `${fallback.provider}:${fallback.model}` : null };
  }

  @Post()
  start(@Body() dto: DrillDto) {
    if (!fallbackSelection(CLAUDE)) {
      throw new BadRequestException('No fallback is configured (FORGE_FALLBACK_BASE_URL / FORGE_FALLBACK_MODEL), so a drill would only pause work.');
    }
    this.usageLimits.record(CLAUDE, { status: 'rejected', resetsAt: Date.now() + dto.minutes * 60_000, limitType: 'drill' });
    return this.status();
  }

  @Delete()
  stop() {
    this.usageLimits.record(CLAUDE, { status: 'allowed' });
    // A fallback that failed during the drill is held until the same reset: release it too.
    this.usageLimits.record('custom', { status: 'allowed' });
    return this.status();
  }
}
