import { Module } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { LessonsController } from './lessons.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { LessonRepository, SectionRepository } from '../database/repositories';

@Module({
  imports: [PrismaModule],
  controllers: [LessonsController],
  providers: [LessonsService, LessonRepository, SectionRepository],
})
export class LessonsModule {}
