import { Module } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { EnrollmentsController } from './enrollments.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EnrollmentRepository, CourseRepository } from '../database/repositories';

@Module({
  imports: [PrismaModule],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService, EnrollmentRepository, CourseRepository],
  exports: [EnrollmentsService, EnrollmentRepository],
})
export class EnrollmentsModule {}
