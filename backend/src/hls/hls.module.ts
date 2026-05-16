import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { HlsService } from './hls.service';
import { HlsProcessor } from './hls.processor';
import { QueueNames } from '../shared/queues';

@Module({
  imports: [BullModule.registerQueue({ name: QueueNames.VIDEO })],
  providers: [HlsService, HlsProcessor],
  exports: [HlsService],
})
export class HlsModule {}
