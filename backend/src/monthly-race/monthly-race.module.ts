import { Module } from '@nestjs/common';
import { MonthlyRaceService } from './monthly-race.service';
import { MonthlyRaceController } from './monthly-race.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MonthlyRaceRepository } from '../database/repositories';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [MonthlyRaceController],
  providers: [MonthlyRaceService, MonthlyRaceRepository],
})
export class MonthlyRaceModule {}
