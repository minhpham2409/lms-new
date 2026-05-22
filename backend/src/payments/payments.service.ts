import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  PaymentRepository,
  OrderRepository,
  EnrollmentRepository,
  ParentChildRepository,
  NotificationRepository,
} from '../database/repositories';
import { CreateQrDto, CreateRefundRequestDto, WebhookDto } from './dto';
import { AppEvents } from '../shared/events';
import {
  PaymentCompletedPayload,
  PaymentFailedPayload,
} from '../shared/events';
import { randomInt, createHmac, timingSafeEqual, createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly successStatuses = new Set(['success', 'paid', 'completed']);
  private readonly finalFailureStatuses = new Set(['failed', 'failure', 'cancelled', 'canceled', 'expired']);
  private readonly nonFinalStatuses = new Set(['pending', 'processing']);

  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly orderRepository: OrderRepository,
    private readonly enrollmentRepository: EnrollmentRepository,
    private readonly parentChildRepository: ParentChildRepository,
    private readonly notificationRepository: NotificationRepository,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private async notifyLinkedParents(
    childId: string,
    payload: { title: string; message: string; type: string },
  ) {
    const links = await this.parentChildRepository.findParentLinks(childId);
    await Promise.all(
      links.map((link) =>
        this.notificationRepository.create({
          userId: link.parentId,
          title: payload.title,
          message: payload.message,
          type: payload.type,
        }).catch((err) => {
          this.logger.warn(`Parent payment notification failed: ${err.message}`);
        }),
      ),
    );
  }

  /**
   * Verify HMAC-SHA256 signature from bank webhook.
   * MANDATORY in production — skipping is only allowed in development.
   */
  private verifyWebhookSignature(dto: WebhookDto): void {
    const webhookSecret = process.env.WEBHOOK_SECRET;

    // ── Production MUST have a secret ────────────────────────────────────
    if (!webhookSecret) {
      if (process.env.NODE_ENV === 'production') {
        throw new UnauthorizedException(
          'WEBHOOK_SECRET is required in production',
        );
      }
      this.logger.warn('[DEV] Skipping webhook signature verification — WEBHOOK_SECRET not set');
      return;
    }

    if (!dto.signature) {
      throw new UnauthorizedException('Missing webhook signature');
    }

    const payload = `${dto.txnRef}|${dto.amount}|${dto.status}`;
    const expected = createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    const expectedBuffer = Buffer.from(expected, 'hex');
    const receivedBuffer = Buffer.from(dto.signature, 'hex');
    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      throw new UnauthorizedException('Invalid webhook signature');
    }
  }

  private buildWebhookEventKey(dto: WebhookDto): string {
    const canonicalPayload = JSON.stringify({
      txnRef: dto.txnRef,
      amount: dto.amount,
      status: dto.status,
      signature: dto.signature ?? '',
    });
    return createHash('sha256').update(canonicalPayload).digest('hex');
  }

  async recordIgnoredWebhook(payload: unknown, reason: string, txnRef?: string) {
    const eventKey = createHash('sha256')
      .update(JSON.stringify({ provider: 'sepay', reason, txnRef: txnRef ?? '', payload }))
      .digest('hex');

    const webhookEvent = await this.paymentRepository.createWebhookEvent({
      eventKey,
      txnRef,
      payload: payload as any,
    });

    if (webhookEvent.duplicate || !webhookEvent.event) {
      return { success: true, message: 'Duplicate ignored webhook' };
    }

    await this.paymentRepository.updateWebhookEventStatus(
      webhookEvent.event.id,
      'rejected',
      reason,
    );

    return { success: true, message: reason };
  }

  getPaymentCodePrefix(): string {
    return (process.env.PAYMENT_CODE_PREFIX || 'HP').trim().toUpperCase();
  }

  private createPaymentCodeSuffix(): string {
    return randomInt(100_000_000, 1_000_000_000).toString();
  }

  private async recordPaymentLedger(params: {
    paymentId: string;
    orderId: string;
    txnRef?: string | null;
    webhookEventId: string;
    amount: number;
    expectedAmount?: number | null;
    paidBefore?: number;
    remainingAfter?: number;
    overpaidAmount?: number;
    status: string;
    note?: string;
    rawPayload: WebhookDto;
  }) {
    if (typeof (this.paymentRepository as any).createPaymentTransaction !== 'function') {
      this.logger.warn('Payment ledger repository method unavailable; skipping ledger write');
      return;
    }
    await this.paymentRepository.createPaymentTransaction({
      provider: 'sepay',
      providerRef: this.buildWebhookEventKey(params.rawPayload),
      ...params,
      rawPayload: params.rawPayload as any,
    }).catch((err) => {
      this.logger.error(`Payment ledger write failed: ${err.message}`);
      throw err;
    });
  }

  private isCurrentPaymentCode(txnRef?: string | null): boolean {
    return typeof txnRef === 'string' && /^\d{3,10}$/.test(txnRef);
  }

  async createQr(dto: CreateQrDto, userId: string) {
    const order = await this.orderRepository.findByIdWithDetails(dto.orderId);
    if (!order) throw new NotFoundException('Order not found');

    // Allow order owner OR linked parent to generate QR
    let authorized = order.userId === userId;
    if (!authorized) {
      const parentLink = await this.enrollmentRepository.findParentLinks(order.userId);
      authorized = parentLink.some(link => link.parentId === userId);
    }
    if (!authorized) throw new NotFoundException('Order not found');

    if (order.status !== 'pending') throw new BadRequestException('Order is not pending');

    const existing = await this.paymentRepository.findByOrderId(dto.orderId);
    if (existing?.status === 'completed') {
      throw new BadRequestException('Order has already been paid');
    }

    const bankCode = process.env.BANK_CODE;
    const bankAccount = process.env.BANK_ACCOUNT;
    const accountName = process.env.BANK_ACCOUNT_NAME;
    if (!bankCode || !bankAccount || !accountName) {
      throw new BadRequestException('Bank transfer configuration is missing');
    }

    const reusePending =
      !dto.forceRegenerate &&
      existing &&
      existing.status === 'pending' &&
      existing.qrData &&
      existing.txnRef &&
      this.isCurrentPaymentCode(existing.txnRef);

    if (reusePending) {
      const addInfo = `${this.getPaymentCodePrefix()}${existing.txnRef}`;
      // Use payment.amount (may have been updated to remaining after partial payment)
      const amount = Number((existing as any).remainingAmount || existing.amount);
      return {
        ...existing,
        bankCode,
        bankAccount,
        accountName,
        addInfo,
        amount,
        vietQrUrl: `https://img.vietqr.io/image/${bankCode}-${bankAccount}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(addInfo)}&accountName=${encodeURIComponent(accountName)}`,
      };
    }

    // Use existing payment amount (remaining after partial) or order finalPrice for new payments
    const paymentAmount = existing ? Number((existing as any).remainingAmount || existing.amount) : Number(order.finalPrice);
    const txnRef = this.createPaymentCodeSuffix();
    const addInfo = `${this.getPaymentCodePrefix()}${txnRef}`;
    const vietQrUrl = `https://img.vietqr.io/image/${bankCode}-${bankAccount}-compact2.png?amount=${paymentAmount}&addInfo=${encodeURIComponent(addInfo)}&accountName=${encodeURIComponent(accountName)}`;
    const qrData = `VIETQR|${txnRef}|${paymentAmount}|${addInfo}`;

    let payment;
    if (existing) {
      payment = await this.paymentRepository.update(existing.id, {
        txnRef,
        qrData,
        status: 'pending',
      });
    } else {
      payment = await this.paymentRepository.create({
        orderId: dto.orderId,
        amount: order.finalPrice,
        remainingAmount: order.finalPrice,
        txnRef,
        qrData,
      } as any);
    }

    return {
      ...payment,
      bankCode,
      bankAccount,
      accountName,
      addInfo,
      amount: paymentAmount,
      vietQrUrl,
    };
  }

  async createRefundRequest(dto: CreateRefundRequestDto, parentId: string) {
    const order = await this.orderRepository.findByIdWithDetails(dto.orderId);
    if (!order) throw new NotFoundException('Order not found');

    const link = await this.parentChildRepository.findLink(parentId, order.userId);
    if (!link || link.status !== 'accepted') {
      throw new ForbiddenException('Parent is not linked to this student');
    }

    const payment = order.payment;
    if (!payment || Number((payment as any).overpaidAmount || 0) <= 0) {
      throw new BadRequestException('No overpaid amount is available for this order');
    }

    const existingRefunds = await (this.prisma as any).refundRequest.aggregate({
      where: {
        orderId: order.id,
        status: { in: ['PENDING', 'APPROVED', 'PAID'] },
      },
      _sum: { amount: true },
    });
    const alreadyRequested = Number(existingRefunds._sum.amount ?? 0);
    const availableAmount = Math.round((Number((payment as any).overpaidAmount) - alreadyRequested) * 100) / 100;
    if (!Number.isFinite(availableAmount) || availableAmount <= 0) {
      throw new BadRequestException('Overpaid amount has already been requested for refund');
    }
    const requestedAmount = Math.round(Number(dto.amount) * 100) / 100;
    if (Number.isFinite(requestedAmount) && requestedAmount > availableAmount + 0.01) {
      throw new BadRequestException('Refund amount exceeds available overpaid amount');
    }
    const amount = availableAmount;

    const existing = await (this.prisma as any).refundRequest.findFirst({
      where: {
        orderId: order.id,
        parentId,
        amount,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });
    if (existing) return existing;

    // Simplified: parent provides banking info, admin transfers manually
    const refund = await (this.prisma as any).refundRequest.create({
      data: {
        orderId: order.id,
        parentId,
        amount,
        bankName: dto.bankName.trim().toUpperCase(),
        bankAccount: dto.bankAccount.trim(),
        bankOwner: dto.bankOwner.trim().toUpperCase(),
        note: dto.note?.trim(),
      },
    });

    // Notify all admins about the refund request
    const admins = await this.prisma.user.findMany({
      where: { role: 'admin' },
      select: { id: true },
    });

    await Promise.all(
      admins.map((admin) =>
        this.notificationRepository.create({
          userId: admin.id,
          title: 'Yêu cầu hoàn tiền chuyển khoản dư',
          message: `Đơn ${order.id.substring(0, 8)} — ${amount.toLocaleString('vi-VN')} ₫ — NH: ${refund.bankName} / ${refund.bankAccount} / ${refund.bankOwner}`,
          type: 'refund_request',
        }).catch((err) => {
          this.logger.warn(`Admin refund notification failed: ${err.message}`);
        }),
      ),
    );

    return refund;
  }

  /**
   * Handle bank webhook — full validation pipeline:
   * 1. Verify HMAC signature
   * 2. Find payment by txnRef
   * 3. Idempotency check (already completed → return early)
   * 4. Verify payment is pending
   * 5. Verify order exists and is pending
   * 6. Verify amount matches
   * 7. If status != success → fail atomically
   * 8. If success → complete atomically (payment + order + coupon + enrollments)
   */
  async handleWebhook(dto: WebhookDto, options?: { skipSignatureVerification?: boolean }) {
    // 1. Validate HMAC signature (skipped for trusted providers like SePay)
    if (!options?.skipSignatureVerification) {
      this.verifyWebhookSignature(dto);
    }

    const eventKey = this.buildWebhookEventKey(dto);
    const webhookEvent = await this.paymentRepository.createWebhookEvent({
      eventKey,
      txnRef: dto.txnRef,
      signature: dto.signature,
      payload: dto as any,
    });

    if (webhookEvent.duplicate) {
      this.logger.warn(`[Webhook replay] Duplicate event ignored for txnRef ${dto.txnRef}`);
      return { success: true, message: 'Duplicate webhook ignored' };
    }

    const webhookEventId = webhookEvent.event!.id;

    try {
      // 2. Find payment
      const payment = await this.paymentRepository.findByTxnRef(dto.txnRef);
      if (!payment) throw new NotFoundException('Transaction not found');

      // 3. Idempotency: already processed
      if (payment.status === 'completed') {
        await this.paymentRepository.updateWebhookEventStatus(
          webhookEventId,
          'duplicate',
        );
        return { success: true, message: 'Already processed' };
      }

      // 4. Payment must be pending
      if (payment.status !== 'pending') {
        throw new BadRequestException(`Payment is in '${payment.status}' state, cannot process`);
      }

      // 5. Order must exist and be pending
      const order = await this.orderRepository.findByIdWithDetails(payment.orderId);
      if (!order) throw new NotFoundException('Order not found');
      if (order.status !== 'pending') {
        throw new BadRequestException(`Order is in '${order.status}' state, cannot process`);
      }

      const normalizedStatus = dto.status.toLowerCase();

      if (this.nonFinalStatuses.has(normalizedStatus)) {
        await this.paymentRepository.updateWebhookEventStatus(
          webhookEventId,
          'processed',
        );
        return { success: true, message: 'Payment status acknowledged' };
      }

      if (!this.successStatuses.has(normalizedStatus) && !this.finalFailureStatuses.has(normalizedStatus)) {
        this.logger.warn(`[Webhook unknown status] ${dto.status} for payment ${payment.id}`);
        await this.paymentRepository.updateWebhookEventStatus(
          webhookEventId,
          'rejected',
          `Unknown status: ${dto.status}`,
        );
        return { success: true, message: 'Payment status rejected for review' };
      }

      // 6. Amount verification — dto.amount must match payment.amount.
      const paymentAmount = Number(payment.amount);
      const paidBefore = Number((payment as any).paidAmount || 0);
      const dtoAmount = Number(dto.amount);
      if (Math.abs(paymentAmount - dtoAmount) > 0.01) {
        // ── UNDERPAYMENT: auto-generate new QR for remaining amount ──
        if (dtoAmount < paymentAmount && this.successStatuses.has(normalizedStatus)) {
          const remaining = Math.round((paymentAmount - dtoAmount) * 100) / 100;
          this.logger.warn(
            `[UNDERPAYMENT] Payment ${payment.id}: expected ${paymentAmount}, got ${dtoAmount}, remaining ${remaining}`,
          );

          // Record this partial payment event as processed
          await this.paymentRepository.updateWebhookEventStatus(
            webhookEventId,
            'processed',
            `Partial payment: received ${dtoAmount}, remaining ${remaining}`,
          );

          // Generate new txnRef for the remaining amount
          const newTxnRef = this.createPaymentCodeSuffix();
          const addInfo = `${this.getPaymentCodePrefix()}${newTxnRef}`;
          const qrData = `VIETQR|${newTxnRef}|${remaining}|${addInfo}`;

          // Update payment: new txnRef, new amount = remaining only
          await this.paymentRepository.update(payment.id, {
            amount: remaining,
            paidAmount: paidBefore + dtoAmount,
            remainingAmount: remaining,
            txnRef: newTxnRef,
            qrData,
          } as any);

          await this.recordPaymentLedger({
            paymentId: payment.id,
            orderId: order.id,
            txnRef: dto.txnRef,
            webhookEventId,
            amount: dtoAmount,
            expectedAmount: paymentAmount,
            paidBefore,
            remainingAfter: remaining,
            status: 'partial',
            note: `Partial payment; new txnRef ${newTxnRef}`,
            rawPayload: dto,
          });

          // Notify parents about partial payment + new QR
          await this.notifyLinkedParents(order.userId, {
            title: 'Chuyển khoản thiếu tiền',
            message: JSON.stringify({
              orderId: order.id,
              expectedAmount: paymentAmount,
              paidAmount: dtoAmount,
              totalPaidAmount: paidBefore + dtoAmount,
              remainingAmount: remaining,
              newTxnRef,
            }),
            type: 'payment_issue',
          });

          // Also notify the student
          await this.notificationRepository.create({
            userId: order.userId,
            title: '⚠️ Chuyển khoản thiếu tiền',
            message: `Đơn hàng đã nhận ${dtoAmount.toLocaleString('vi-VN')} ₫, còn thiếu ${remaining.toLocaleString('vi-VN')} ₫. Mã QR mới đã được tạo tự động.`,
            type: 'warning',
          }).catch(() => undefined);

          return { success: true, message: `Partial payment received. Remaining: ${remaining}` };
        }

        // ── OVERPAYMENT: complete the order, then ask parent for refund details ──
        if (dtoAmount > paymentAmount && this.successStatuses.has(normalizedStatus)) {
          const overpaidAmount = Math.round((dtoAmount - paymentAmount) * 100) / 100;
          const totalPaidAmount = paidBefore + dtoAmount;
          this.logger.warn(
            `[OVERPAYMENT] Payment ${payment.id}: expected ${paymentAmount}, got ${dtoAmount}, overpaid ${overpaidAmount}`,
          );

          const courseItems = order.items.map((item) => ({ courseId: item.courseId }));
          const result = await this.paymentRepository.completePaymentTransaction({
            paymentId: payment.id,
            orderId: payment.orderId,
            userId: order.userId,
            courseItems,
            couponId: order.couponId ?? undefined,
            paidAmount: totalPaidAmount,
            overpaidAmount,
          });

          if (result?.alreadyProcessed) {
            await this.paymentRepository.updateWebhookEventStatus(
              webhookEventId,
              'duplicate',
            );
            return { success: true, message: 'Already processed' };
          }

          const titles = order.items
            .map((item) => item.course?.title)
            .filter((t): t is string => !!t);

          this.eventEmitter.emit(AppEvents.PAYMENT_COMPLETED, {
            paymentId: payment.id,
            orderId: order.id,
            userId: order.userId,
            amount: Number(order.finalPrice),
            courseIds: courseItems.map((c) => c.courseId),
            courseTitles: titles,
          } as PaymentCompletedPayload);

          await this.paymentRepository.updateWebhookEventStatus(
            webhookEventId,
            'processed',
            `Overpayment: expected ${paymentAmount}, got ${dtoAmount}, refund ${overpaidAmount}`,
          );

          await this.recordPaymentLedger({
            paymentId: payment.id,
            orderId: order.id,
            txnRef: dto.txnRef,
            webhookEventId,
            amount: dtoAmount,
            expectedAmount: paymentAmount,
            paidBefore,
            remainingAfter: 0,
            overpaidAmount,
            status: 'overpaid',
            rawPayload: dto,
          });

          await this.notifyLinkedParents(order.userId, {
            title: 'Thanh toán dư tiền',
            message: JSON.stringify({
              orderId: order.id,
              expectedAmount: paymentAmount,
              paidAmount: dtoAmount,
              totalPaidAmount,
              overpaidAmount,
            }),
            type: 'payment_overpaid',
          });

          await this.notificationRepository.create({
            userId: order.userId,
            title: 'Thanh toán thành công, có tiền chuyển dư',
            message: `Đơn hàng đã được kích hoạt. Số tiền chuyển dư ${overpaidAmount.toLocaleString('vi-VN')} ₫ sẽ được hoàn sau khi phụ huynh gửi thông tin ngân hàng.`,
            type: 'warning',
          }).catch(() => undefined);

          return { success: true, message: `Payment confirmed with overpayment. Refund: ${overpaidAmount}` };
        }

        // ── Non-success mismatch: keep for manual review ──
        this.logger.error(
          `[AMOUNT MISMATCH] Payment ${payment.id}: expected ${paymentAmount}, got ${dtoAmount}`,
        );
        await this.paymentRepository.updateWebhookEventStatus(
          webhookEventId,
          'rejected',
          `Amount mismatch: expected ${paymentAmount}, got ${dtoAmount}`,
        );
        await this.notifyLinkedParents(order.userId, {
          title: 'Thanh toán chưa khớp',
          message: JSON.stringify({
            orderId: order.id,
            expectedAmount: paymentAmount,
            paidAmount: dtoAmount,
          }),
          type: 'payment_issue',
        });
        await this.recordPaymentLedger({
          paymentId: payment.id,
          orderId: order.id,
          txnRef: dto.txnRef,
          webhookEventId,
          amount: dtoAmount,
          expectedAmount: paymentAmount,
          paidBefore,
          remainingAfter: paymentAmount,
          status: 'rejected',
          note: `Amount mismatch: expected ${paymentAmount}, got ${dtoAmount}`,
          rawPayload: dto,
        });
        return { success: true, message: 'Amount mismatch — payment rejected for review' };
      }

      // ── Payment Failed ─────────────────────────────────────────────────────
      if (this.finalFailureStatuses.has(normalizedStatus)) {
        await this.paymentRepository.failPaymentTransaction({
          paymentId: payment.id,
          orderId: payment.orderId,
        });

        this.eventEmitter.emit(AppEvents.PAYMENT_FAILED, {
          paymentId: payment.id,
          orderId: payment.orderId,
          userId: order.userId,
          reason: `Bank returned final status: ${dto.status}`,
        } as PaymentFailedPayload);

        await this.paymentRepository.updateWebhookEventStatus(
          webhookEventId,
          'processed',
        );
        await this.recordPaymentLedger({
          paymentId: payment.id,
          orderId: order.id,
          txnRef: dto.txnRef,
          webhookEventId,
          amount: dtoAmount,
          expectedAmount: paymentAmount,
          paidBefore,
          remainingAfter: paymentAmount,
          status: 'failed',
          note: `Bank returned final status: ${dto.status}`,
          rawPayload: dto,
        });
        return { success: true, message: 'Payment failed' };
      }

      // ── Payment Success: Atomic Transaction ────────────────────────────────
      const courseItems = order.items.map((item) => ({ courseId: item.courseId }));

      // All-or-nothing: Payment ✓ → Order ✓ → Coupon increment ✓ → Enrollments ✓
      const result = await this.paymentRepository.completePaymentTransaction({
        paymentId: payment.id,
        orderId: payment.orderId,
        userId: order.userId,
        courseItems,
        couponId: order.couponId ?? undefined,
        paidAmount: paidBefore + dtoAmount,
      });

      // Duplicate webhook that arrived after we already processed — safe
      if (result?.alreadyProcessed) {
        await this.paymentRepository.updateWebhookEventStatus(
          webhookEventId,
          'duplicate',
        );
        return { success: true, message: 'Already processed' };
      }

      this.logger.log(
        `[Transaction OK] Payment ${payment.id} → Order ${order.id} → ${courseItems.length} enrollments`,
      );

      // ── Emit Domain Event (async side-effects) ─────────────────────────────
      const titles = order.items
        .map((item) => item.course?.title)
        .filter((t): t is string => !!t);

      this.eventEmitter.emit(AppEvents.PAYMENT_COMPLETED, {
        paymentId: payment.id,
        orderId: order.id,
        userId: order.userId,
        amount: Number(order.finalPrice),
        courseIds: courseItems.map((c) => c.courseId),
        courseTitles: titles,
      } as PaymentCompletedPayload);

      await this.paymentRepository.updateWebhookEventStatus(
        webhookEventId,
        'processed',
      );

      await this.recordPaymentLedger({
        paymentId: payment.id,
        orderId: order.id,
        txnRef: dto.txnRef,
        webhookEventId,
        amount: dtoAmount,
        expectedAmount: paymentAmount,
        paidBefore,
        remainingAfter: 0,
        status: 'completed',
        rawPayload: dto,
      });

      await this.notifyLinkedParents(order.userId, {
        title: 'Thanh toán thành công',
        message: JSON.stringify({
          orderId: order.id,
          amount: Number(order.finalPrice),
        }),
        type: 'payment_success',
      });

      return { success: true, message: 'Payment confirmed, enrollments created' };
    } catch (error) {
      await this.paymentRepository.updateWebhookEventStatus(
        webhookEventId,
        'failed',
        (error as Error).message,
      );
      throw error;
    }
  }
}
