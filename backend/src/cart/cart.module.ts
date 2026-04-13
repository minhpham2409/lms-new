import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CartRepository, CouponRepository } from '../database/repositories';

@Module({
  imports: [PrismaModule],
  controllers: [CartController],
  providers: [CartService, CartRepository, CouponRepository],
  exports: [CartService],
})
export class CartModule {}
