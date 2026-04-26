import { Module } from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { QuizzesController } from './quizzes.controller';
import { QuestionsController } from './questions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { QuizRepository, AssignmentRepository } from '../database/repositories';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [QuizzesController, QuestionsController],
  providers: [QuizzesService, QuizRepository, AssignmentRepository],
  exports: [QuizzesService],
})
export class QuizzesModule {}
