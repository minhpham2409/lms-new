import { Module } from '@nestjs/common';
import { ParentsService } from './parents.service';
import { ParentsController } from './parents.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ParentChildRepository, ParentDashboardRepository } from '../database/repositories';

@Module({
  imports: [PrismaModule],
  controllers: [ParentsController],
  providers: [ParentsService, ParentChildRepository, ParentDashboardRepository],
})
export class ParentsModule {}
