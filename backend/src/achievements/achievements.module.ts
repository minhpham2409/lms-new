import { Module } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { AchievementsController } from './achievements.controller';
import { AchievementEventListener } from './achievement-event.listener';
import { PrismaModule } from '../prisma/prisma.module';
import { AchievementRepository } from '../database/repositories';

@Module({
  imports: [PrismaModule],
  controllers: [AchievementsController],
  providers: [AchievementsService, AchievementEventListener, AchievementRepository],
  exports: [AchievementsService],
})
export class AchievementsModule {}
