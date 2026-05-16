import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import {
  UserRepository,
  CourseRepository,
  OrderRepository,
  LessonRepository,
  SectionRepository,
  AdminRepository,
} from '../database/repositories';
import { QueueNames } from '../shared/queues';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    BullModule.registerQueue(
      { name: QueueNames.EMAIL },
      { name: QueueNames.CERTIFICATE },
      { name: QueueNames.NOTIFICATION },
      { name: QueueNames.VIDEO },
      { name: QueueNames.WALLET },
    ),
  ],
  controllers: [AdminController],
  providers: [
    AdminService,
    UserRepository,
    CourseRepository,
    OrderRepository,
    LessonRepository,
    SectionRepository,
    AdminRepository,
  ],
})
export class AdminModule {}
