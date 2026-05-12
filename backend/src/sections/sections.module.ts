import { Module } from '@nestjs/common';
import { SectionsService } from './sections.service';
import { SectionsController } from './sections.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SectionRepository, CourseRepository } from '../database/repositories';

@Module({
  imports: [PrismaModule],
  controllers: [SectionsController],
  providers: [SectionsService, SectionRepository, CourseRepository],
  exports: [SectionsService],
})
export class SectionsModule {}
