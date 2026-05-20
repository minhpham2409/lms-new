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
        payment: true,
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

  /**
   * ATOMIC: Create order + items + pending enrollments + clear cart in a single transaction.
   * Prevents partial state (e.g., order created but enrollment/cart not handled).
   */
  createOrderTransaction(data: {
    userId: string;
    couponId?: string;
    totalPrice: number;
    finalPrice: number;
    items: { courseId: string; price: number }[];
  }) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
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

      // Create pending enrollments for paid courses (idempotent upsert)
      for (const item of data.items) {
        await tx.enrollment.upsert({
          where: {
            userId_courseId: {
              userId: data.userId,
              courseId: item.courseId,
            },
          },
          create: {
            userId: data.userId,
            courseId: item.courseId,
            status: 'pending',
            progress: 0,
          },
          update: {}, // If already exists (e.g. free course active), don't overwrite
        });
      }

      // Clear cart atomically with order creation
      await tx.cartItem.deleteMany({ where: { userId: data.userId } });

      return order;
    });
  }
}
