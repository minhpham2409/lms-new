import { Module } from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { QuizzesController } from './quizzes.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { QuizRepository, AssignmentRepository, EnrollmentRepository } from '../database/repositories';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [QuizzesController],
  providers: [QuizzesService, QuizRepository, AssignmentRepository, EnrollmentRepository],
})
export class QuizzesModule {}
