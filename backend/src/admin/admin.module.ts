import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import {
  UserRepository,
  CourseRepository,
  OrderRepository,
  LessonRepository,
  SectionRepository,
  AdminRepository,
} from '../database/repositories';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
  ],
  controllers: [AdminController],
  providers: [
    AdminService,
    UserRepository,
    CourseRepository,
    OrderRepository,
    LessonRepository,
    SectionRepository,
    AdminRepository,
  ],
})
export class AdminModule {}
