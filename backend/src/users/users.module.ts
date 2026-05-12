import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AchievementsModule } from '../achievements/achievements.module';
import { UserRepository, StudentDashboardRepository } from '../database/repositories';

@Module({
  imports: [PrismaModule, NotificationsModule, AchievementsModule],
  controllers: [UsersController],
  providers: [UsersService, UserRepository, StudentDashboardRepository],
  exports: [UsersService],
})
export class UsersModule {}
