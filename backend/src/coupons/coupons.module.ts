import { Module } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CouponsController } from './coupons.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CouponRepository } from '../database/repositories';

@Module({
  imports: [PrismaModule],
  controllers: [CouponsController],
  providers: [CouponsService, CouponRepository],
  exports: [CouponsService],
})
export class CouponsModule {}
