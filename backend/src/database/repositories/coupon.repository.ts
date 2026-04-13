import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseRepository } from './base.repository';
import { Coupon } from '@prisma/client';

@Injectable()
export class CouponRepository extends BaseRepository<Coupon> {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  get model() {
    return this.prisma.coupon;
  }

  findByCode(code: string) {
    return this.prisma.coupon.findUnique({ where: { code } });
  }

  incrementUsed(id: string) {
    return this.prisma.coupon.update({
      where: { id },
      data: { usedCount: { increment: 1 } },
    });
  }
}
