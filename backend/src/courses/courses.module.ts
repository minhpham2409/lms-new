import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CourseRepository, ReviewRepository } from '../database/repositories';
import { ReviewsService } from '../reviews/reviews.service';

@Module({
  imports: [PrismaModule],
  controllers: [CoursesController],
  providers: [CoursesService, CourseRepository, ReviewsService, ReviewRepository],
  exports: [CoursesService],
})
export class CoursesModule {}
