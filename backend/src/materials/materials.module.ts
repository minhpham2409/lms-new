import { Module } from '@nestjs/common';
import { MaterialsService } from './materials.service';
import { MaterialsController } from './materials.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MaterialRepository, LessonRepository, EnrollmentRepository } from '../database/repositories';

@Module({
  imports: [PrismaModule],
  controllers: [MaterialsController],
  providers: [MaterialsService, MaterialRepository, LessonRepository, EnrollmentRepository],
  exports: [MaterialsService],
})
export class MaterialsModule {}
