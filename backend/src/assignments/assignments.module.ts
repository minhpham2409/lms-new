import { Module } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { AssignmentsController } from './assignments.controller';
import { SubmissionsController } from './submissions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AssignmentRepository, SubmissionRepository } from '../database/repositories';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [AssignmentsController, SubmissionsController],
  providers: [AssignmentsService, AssignmentRepository, SubmissionRepository],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}
