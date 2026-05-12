import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommentRepository, LessonRepository, EnrollmentRepository } from '../database/repositories';

@Module({
  imports: [PrismaModule],
  controllers: [CommentsController],
  providers: [CommentsService, CommentRepository, LessonRepository, EnrollmentRepository],
})
export class CommentsModule {}
