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
import { randomUUID, createHmac, timingSafeEqual, createHash } from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly successStatuses = new Set(['success', 'paid', 'completed']);
  private readonly finalFailureStatuses = new Set(['failed', 'failure', 'cancelled', 'canceled', 'expired']);
  private readonly nonFinalStatuses = new Set(['pending', 'processing']);

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

    const eventKey = this.buildWebhookEventKey(dto);
    const webhookEvent = await this.paymentRepository.createWebhookEvent({
      eventKey,
      txnRef: dto.txnRef,
      signature: dto.signature,
      payload: dto as any,
    });

    if (webhookEvent.duplicate) {
      this.logger.warn(`[Webhook replay] Duplicate event ignored for txnRef ${dto.txnRef}`);
      return { message: 'Duplicate webhook ignored' };
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

      const normalizedStatus = dto.status.toLowerCase();

      if (this.nonFinalStatuses.has(normalizedStatus)) {
        await this.paymentRepository.updateWebhookEventStatus(
          webhookEventId,
          'processed',
        );
        return { message: 'Payment status acknowledged' };
      }

      if (!this.successStatuses.has(normalizedStatus) && !this.finalFailureStatuses.has(normalizedStatus)) {
        this.logger.warn(`[Webhook unknown status] ${dto.status} for payment ${payment.id}`);
        await this.paymentRepository.updateWebhookEventStatus(
          webhookEventId,
          'rejected',
          `Unknown status: ${dto.status}`,
        );
        return { message: 'Payment status rejected for review' };
      }

      // 6. Amount verification — dto.amount must match payment.amount.
      // Do not fail the order automatically; reject the event for manual review.
      const paymentAmount = Number(payment.amount);
      const dtoAmount = Number(dto.amount);
      if (Math.abs(paymentAmount - dtoAmount) > 0.01) {
        this.logger.error(
          `[AMOUNT MISMATCH] Payment ${payment.id}: expected ${paymentAmount}, got ${dtoAmount}`,
        );
        await this.paymentRepository.updateWebhookEventStatus(
          webhookEventId,
          'rejected',
          `Amount mismatch: expected ${paymentAmount}, got ${dtoAmount}`,
        );
        return { message: 'Amount mismatch — payment rejected for review' };
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
        await this.paymentRepository.updateWebhookEventStatus(
          webhookEventId,
          'duplicate',
        );
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

      await this.paymentRepository.updateWebhookEventStatus(
        webhookEventId,
        'processed',
      );

      return { message: 'Payment confirmed, enrollments created' };
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
