import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaymentRepository, OrderRepository } from '../database/repositories';
import { CreateQrDto, WebhookDto } from './dto';
import { AppEvents } from '../shared/events';
import {
  PaymentCompletedPayload,
  PaymentFailedPayload,
} from '../shared/events';
import { randomUUID, createHmac } from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly orderRepository: OrderRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

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

    if (dto.signature !== expected) {
      throw new UnauthorizedException('Invalid webhook signature');
    }
  }

  async createQr(dto: CreateQrDto, userId: string) {
    const order = await this.orderRepository.findByIdWithDetails(dto.orderId);
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new NotFoundException('Order not found');
    if (order.status !== 'pending') throw new BadRequestException('Order is not pending');

    const existing = await this.paymentRepository.findByOrderId(dto.orderId);
    if (existing?.status === 'completed') {
      throw new BadRequestException('Order has already been paid');
    }

    const reusePending =
      !dto.forceRegenerate &&
      existing &&
      existing.status === 'pending' &&
      existing.qrData &&
      existing.txnRef;

    if (reusePending) {
      return existing;
    }

    const txnRef = randomUUID();
    const finalPrice = Number(order.finalPrice);
    const qrData = `VIETQR|${txnRef}|${finalPrice}|LMS Payment ${order.id}`;

    if (existing) {
      return this.paymentRepository.update(existing.id, {
        txnRef,
        qrData,
        status: 'pending',
      });
    }

    return this.paymentRepository.create({
      orderId: dto.orderId,
      amount: order.finalPrice,
      txnRef,
      qrData,
    });
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
  async handleWebhook(dto: WebhookDto) {
    // 1. Validate HMAC signature
    this.verifyWebhookSignature(dto);

    // 2. Find payment
    const payment = await this.paymentRepository.findByTxnRef(dto.txnRef);
    if (!payment) throw new NotFoundException('Transaction not found');

    // 3. Idempotency: already processed
    if (payment.status === 'completed') {
      return { message: 'Already processed' };
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

    // 6. Amount verification — dto.amount must match payment.amount
    const paymentAmount = Number(payment.amount);
    const dtoAmount = Number(dto.amount);
    if (Math.abs(paymentAmount - dtoAmount) > 0.01) {
      this.logger.error(
        `[AMOUNT MISMATCH] Payment ${payment.id}: expected ${paymentAmount}, got ${dtoAmount}`,
      );
      await this.paymentRepository.failPaymentTransaction({
        paymentId: payment.id,
        orderId: payment.orderId,
      });
      return { message: 'Amount mismatch — payment rejected' };
    }

    // ── Payment Failed ─────────────────────────────────────────────────────
    if (dto.status !== 'success') {
      await this.paymentRepository.failPaymentTransaction({
        paymentId: payment.id,
        orderId: payment.orderId,
      });

      this.eventEmitter.emit(AppEvents.PAYMENT_FAILED, {
        paymentId: payment.id,
        orderId: payment.orderId,
        userId: order.userId,
        reason: `Bank returned status: ${dto.status}`,
      } as PaymentFailedPayload);

      return { message: 'Payment failed' };
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
    });

    // Duplicate webhook that arrived after we already processed — safe
    if (result?.alreadyProcessed) {
      return { message: 'Already processed' };
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

    return { message: 'Payment confirmed, enrollments created' };
  }
}
