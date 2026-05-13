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
      // 1. Conditional update: only proceed if payment is STILL pending.
      //    If another webhook beat us, this will update 0 rows.
      const paymentUpdate = await tx.payment.updateMany({
        where: { id: params.paymentId, status: 'pending' },
        data: { status: 'completed', paidAt: new Date() },
      });

      if (paymentUpdate.count === 0) {
        // Already processed by another concurrent request — safe no-op
        return { alreadyProcessed: true };
      }

      // 2. Conditional update: only mark order paid if still pending
      await tx.order.updateMany({
        where: { id: params.orderId, status: 'pending' },
        data: { status: 'paid' },
      });

      // 3. Increment coupon usedCount with maxUses guard (prevents over-use in race)
      if (params.couponId) {
        const coupon = await tx.coupon.findUnique({
          where: { id: params.couponId },
          select: { usedCount: true, maxUses: true },
        });
        if (coupon && (!coupon.maxUses || coupon.usedCount < coupon.maxUses)) {
          await tx.coupon.update({
            where: { id: params.couponId },
            data: { usedCount: { increment: 1 } },
          });
        }
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

      return { alreadyProcessed: false };
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
