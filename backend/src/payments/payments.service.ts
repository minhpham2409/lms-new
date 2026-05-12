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

  /** Verify HMAC-SHA256 signature from bank webhook. */
  private verifyWebhookSignature(dto: WebhookDto): void {
    const webhookSecret = process.env.WEBHOOK_SECRET;
    // If no secret configured, skip verification (dev mode)
    if (!webhookSecret) return;

    if (!dto.signature) {
      throw new UnauthorizedException('Missing webhook signature');
    }

    // Canonical string: txnRef|amount|status
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
    const qrData = `VIETQR|${txnRef}|${order.finalPrice}|LMS Payment ${order.id}`;

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
   * Handle bank webhook: verify signature, then atomically complete
   * payment + order + enrollments using prisma.$transaction.
   * After commit, emit PAYMENT_COMPLETED event for async side-effects
   * (notifications, invoice email via Bull Queue, badge checks, etc.)
   */
  async handleWebhook(dto: WebhookDto) {
    // Validate HMAC signature from bank
    this.verifyWebhookSignature(dto);

    const payment = await this.paymentRepository.findByTxnRef(dto.txnRef);
    if (!payment) throw new NotFoundException('Transaction not found');
    if (payment.status === 'completed') return { message: 'Already processed' };

    // ── Payment Failed ─────────────────────────────────────────────────────
    if (dto.status !== 'success') {
      await this.paymentRepository.failPaymentTransaction({
        paymentId: payment.id,
        orderId: payment.orderId,
      });

      this.eventEmitter.emit(AppEvents.PAYMENT_FAILED, {
        paymentId: payment.id,
        orderId: payment.orderId,
        userId: '',
        reason: `Bank returned status: ${dto.status}`,
      } as PaymentFailedPayload);

      return { message: 'Payment failed' };
    }

    // ── Payment Success: Atomic Transaction ────────────────────────────────
    const order = await this.orderRepository.findByIdWithDetails(payment.orderId);
    if (!order) throw new NotFoundException('Order not found');

    const courseItems = order.items.map((item) => ({ courseId: item.courseId }));

    // All-or-nothing: Payment ✓ → Order ✓ → Enrollments ✓
    await this.paymentRepository.completePaymentTransaction({
      paymentId: payment.id,
      orderId: payment.orderId,
      userId: order.userId,
      courseItems,
    });

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
      amount: order.finalPrice,
      courseIds: courseItems.map((c) => c.courseId),
      courseTitles: titles,
    } as PaymentCompletedPayload);

    return { message: 'Payment confirmed, enrollments created' };
  }
}
