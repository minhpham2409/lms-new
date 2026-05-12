import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CartRepository, CouponRepository, CourseRepository, EnrollmentRepository } from '../database/repositories';

@Module({
  imports: [PrismaModule],
  controllers: [CartController],
  providers: [CartService, CartRepository, CouponRepository, CourseRepository, EnrollmentRepository],
  exports: [CartService],
})
export class CartModule {}
