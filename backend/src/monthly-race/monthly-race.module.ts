import { Module } from '@nestjs/common';
import { MonthlyRaceService } from './monthly-race.service';
import { MonthlyRaceController } from './monthly-race.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [MonthlyRaceController],
  providers: [MonthlyRaceService],
  exports: [MonthlyRaceService],
})
export class MonthlyRaceModule {}
