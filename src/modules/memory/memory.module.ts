import { Module } from '@nestjs/common';
import { MemoryService } from './memory.service';
import { MemoryController } from './memory.controller';

/**
 * Agent memory (spec §15): durable, retrievable lessons per employee. Exported so
 * the execution path can recall them into a run's context and the evaluation path
 * can write outcomes back.
 */
@Module({
  providers: [MemoryService],
  controllers: [MemoryController],
  exports: [MemoryService],
})
export class MemoryModule {}
