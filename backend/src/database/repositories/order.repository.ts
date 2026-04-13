import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseRepository } from './base.repository';
import { Order } from '@prisma/client';

@Injectable()
export class OrderRepository extends BaseRepository<Order> {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  get model() {
    return this.prisma.order;
  }

  findByUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: { include: { course: { select: { id: true, title: true, thumbnail: true } } } },
        coupon: { select: { code: true, discount: true } },
        payment: { select: { status: true, paidAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findByIdWithDetails(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { course: { select: { id: true, title: true, thumbnail: true, price: true } } } },
        coupon: { select: { code: true, discount: true } },
        payment: true,
        user: { select: { id: true, username: true, email: true } },
      },
    });
  }

  createWithItems(data: {
    userId: string;
    couponId?: string;
    totalPrice: number;
    finalPrice: number;
    items: { courseId: string; price: number }[];
  }) {
    return this.prisma.order.create({
      data: {
        userId: data.userId,
        couponId: data.couponId,
        totalPrice: data.totalPrice,
        finalPrice: data.finalPrice,
        items: { create: data.items },
      },
      include: {
        items: { include: { course: { select: { id: true, title: true } } } },
        coupon: { select: { code: true, discount: true } },
      },
    });
  }
}
