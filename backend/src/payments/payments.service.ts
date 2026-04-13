import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PaymentRepository, OrderRepository } from '../database/repositories';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQrDto, WebhookDto } from './dto';
import { randomUUID } from 'crypto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly orderRepository: OrderRepository,
    private readonly prisma: PrismaService,
  ) {}

  async createQr(dto: CreateQrDto, userId: string) {
    const order = await this.orderRepository.findByIdWithDetails(dto.orderId);
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new NotFoundException('Order not found');
    if (order.status !== 'pending') throw new BadRequestException('Order is not pending');

    const existing = await this.paymentRepository.findByOrderId(dto.orderId);
    if (existing && existing.status === 'completed') {
      throw new BadRequestException('Order has already been paid');
    }

    const txnRef = randomUUID();
    const qrData = `VIETQR|${txnRef}|${order.finalPrice}|LMS Payment ${order.id}`;

    if (existing) {
      return this.paymentRepository.update(existing.id, { txnRef, qrData });
    }

    return this.paymentRepository.create({
      orderId: dto.orderId,
      amount: order.finalPrice,
      txnRef,
      qrData,
    });
  }

  async handleWebhook(dto: WebhookDto) {
    const payment = await this.paymentRepository.findByTxnRef(dto.txnRef);
    if (!payment) throw new NotFoundException('Transaction not found');
    if (payment.status === 'completed') return { message: 'Already processed' };

    if (dto.status !== 'success') {
      await this.paymentRepository.update(payment.id, { status: 'failed' });
      return { message: 'Payment failed' };
    }

    await this.paymentRepository.update(payment.id, {
      status: 'completed',
      paidAt: new Date(),
    });

    const order = await this.orderRepository.findByIdWithDetails(payment.orderId);
    await this.prisma.order.update({
      where: { id: payment.orderId },
      data: { status: 'paid' },
    });

    for (const item of order.items) {
      const enrolled = await this.prisma.enrollment.findFirst({
        where: { userId: order.userId, courseId: item.courseId },
      });
      if (!enrolled) {
        await this.prisma.enrollment.create({
          data: { userId: order.userId, courseId: item.courseId },
        });
      }
    }

    return { message: 'Payment confirmed, enrollments created' };
  }
}
