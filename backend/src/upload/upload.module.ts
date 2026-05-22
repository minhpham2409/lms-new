import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { UploadCleanupService } from './upload-cleanup.service';
import { HlsModule } from '../hls/hls.module';
import { QueueNames } from '../shared/queues';

@Module({
  imports: [HlsModule, BullModule.registerQueue({ name: QueueNames.VIDEO })],
  controllers: [UploadController],
  providers: [UploadService, UploadCleanupService],
  exports: [UploadService],
})
export class UploadModule {}
