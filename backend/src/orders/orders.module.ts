import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { OrderRepository, CartRepository, CouponRepository } from '../database/repositories';

@Module({
  imports: [PrismaModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderRepository, CartRepository, CouponRepository],
  exports: [OrdersService],
})
export class OrdersModule {}
