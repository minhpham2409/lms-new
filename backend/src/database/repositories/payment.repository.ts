import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseRepository } from './base.repository';
import { Payment } from '@prisma/client';

@Injectable()
export class PaymentRepository extends BaseRepository<Payment> {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  get model() {
    return this.prisma.payment;
  }

  findByOrderId(orderId: string) {
    return this.prisma.payment.findUnique({ where: { orderId } });
  }

  findByTxnRef(txnRef: string) {
    return this.prisma.payment.findUnique({ where: { txnRef } });
  }

  /**
   * ATOMIC TRANSACTION: Complete payment → mark order paid → create enrollments.
   *
   * If ANY step fails, ALL changes are rolled back — protecting against:
   * - User paying but not getting enrolled
   * - Order marked paid but payment not recorded
   * - Partial enrollment (some courses enrolled, others not)
   */
  async completePaymentTransaction(params: {
    paymentId: string;
    orderId: string;
    userId: string;
    courseItems: { courseId: string }[];
    couponId?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Mark payment as completed
      await tx.payment.update({
        where: { id: params.paymentId },
        data: { status: 'completed', paidAt: new Date() },
      });

      // 2. Mark order as paid
      await tx.order.update({
        where: { id: params.orderId },
        data: { status: 'paid' },
      });

      // 3. Increment coupon usedCount (only on successful payment, not at order creation)
      if (params.couponId) {
        await tx.coupon.update({
          where: { id: params.couponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      // 4. Create enrollments for each course (idempotent upsert)
      for (const item of params.courseItems) {
        await tx.enrollment.upsert({
          where: {
            userId_courseId: {
              userId: params.userId,
              courseId: item.courseId,
            },
          },
          create: {
            userId: params.userId,
            courseId: item.courseId,
            status: 'active',
            progress: 0,
          },
          update: {
            status: 'active',
          },
        });
      }
    });
  }

  /**
   * ATOMIC TRANSACTION: Fail a payment and optionally mark order as failed.
   */
  async failPaymentTransaction(params: { paymentId: string; orderId?: string }) {
    return this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: params.paymentId },
        data: { status: 'failed' },
      });

      if (params.orderId) {
        await tx.order.update({
          where: { id: params.orderId },
          data: { status: 'failed' },
        });
      }
    });
  }
}
