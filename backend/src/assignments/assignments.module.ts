import { Module } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { AssignmentsController } from './assignments.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import {
  AssignmentRepository,
  SubmissionRepository,
  LessonRepository,
  EnrollmentRepository,
  UserRepository,
  ParentChildRepository,
} from '../database/repositories';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [AssignmentsController],
  providers: [
    AssignmentsService,
    AssignmentRepository,
    SubmissionRepository,
    LessonRepository,
    EnrollmentRepository,
    UserRepository,
    ParentChildRepository,
  ],
})
export class AssignmentsModule {}
