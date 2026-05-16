import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaCleanupService } from './media-cleanup.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [MediaController],
  providers: [MediaCleanupService],
})
export class MediaModule {}
