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
}
