import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationRepository } from '../database/repositories';
import { NotificationEventListener } from './notification-event.listener';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationRepository, NotificationEventListener],
  exports: [NotificationsService],
})
export class NotificationsModule {}
