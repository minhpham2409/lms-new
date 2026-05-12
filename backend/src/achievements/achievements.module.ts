import { Module } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { AchievementsController } from './achievements.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AchievementEventListener } from './achievement-event.listener';

@Module({
  imports: [PrismaModule],
  controllers: [AchievementsController],
  providers: [AchievementsService, AchievementEventListener],
  exports: [AchievementsService],
})
export class AchievementsModule {}
