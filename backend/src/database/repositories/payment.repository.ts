import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseRepository } from './base.repository';
import { Payment, Prisma } from '@prisma/client';

export type WebhookEventStatusValue =
  | 'received'
  | 'processed'
  | 'duplicate'
  | 'rejected'
  | 'failed';

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

  async createWebhookEvent(params: {
    eventKey: string;
    eventId?: string;
    txnRef?: string;
    signature?: string;
    payload: Prisma.InputJsonValue;
  }) {
    try {
      const event = await (this.prisma as any).webhookEvent.create({
        data: {
          provider: 'bank',
          eventKey: params.eventKey,
          eventId: params.eventId,
          txnRef: params.txnRef,
          signature: params.signature,
          payload: params.payload,
          status: 'received',
        },
      });
      return { event, duplicate: false };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return { event: null, duplicate: true };
      }
      throw error;
    }
  }

  updateWebhookEventStatus(
    eventId: string,
    status: WebhookEventStatusValue,
    error?: string,
  ) {
    return (this.prisma as any).webhookEvent.update({
      where: { id: eventId },
      data: {
        status,
        error,
        processedAt: new Date(),
      },
    });
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
      const orderUpdate = await tx.order.updateMany({
        where: { id: params.orderId, status: 'pending' },
        data: { status: 'paid' },
      });

      if (orderUpdate.count === 0) {
        throw new Error('Order is no longer pending; payment completion rolled back');
      }

      // 3. Increment coupon usedCount with maxUses guard (prevents over-use in race)
      if (params.couponId) {
        const coupon = await tx.coupon.findUnique({
          where: { id: params.couponId },
          select: { usedCount: true, maxUses: true },
        });

        if (!coupon) {
          throw new Error('Coupon not found; payment completion rolled back');
        }

        if (coupon.maxUses) {
          const couponUpdate = await tx.coupon.updateMany({
            where: {
              id: params.couponId,
              usedCount: { lt: coupon.maxUses },
            },
            data: { usedCount: { increment: 1 } },
          });

          if (couponUpdate.count === 0) {
            throw new Error('Coupon usage limit reached; payment completion rolled back');
          }
        } else {
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
   * ATOMIC TRANSACTION: Fail a payment, mark order as failed, cancel pending enrollments.
   */
  async failPaymentTransaction(params: { paymentId: string; orderId?: string }) {
    return this.prisma.$transaction(async (tx) => {
      const paymentUpdate = await tx.payment.updateMany({
        where: { id: params.paymentId, status: 'pending' },
        data: { status: 'failed' },
      });

      if (paymentUpdate.count === 0) {
        return { alreadyProcessed: true };
      }

      if (params.orderId) {
        await tx.order.updateMany({
          where: { id: params.orderId, status: 'pending' },
          data: { status: 'failed' },
        });

        // Cancel pending enrollments created with this order
        const orderItems = await tx.orderItem.findMany({
          where: { orderId: params.orderId },
          select: { courseId: true },
        });
        const order = await tx.order.findUnique({
          where: { id: params.orderId },
          select: { userId: true },
        });
        if (order) {
          for (const item of orderItems) {
            await tx.enrollment.updateMany({
              where: {
                userId: order.userId,
                courseId: item.courseId,
                status: 'pending',
              },
              data: { status: 'cancelled' },
            });
          }
        }
      }

      return { alreadyProcessed: false };
    });
  }
}
