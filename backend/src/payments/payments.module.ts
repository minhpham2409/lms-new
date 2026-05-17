import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PrismaModule } from '../prisma/prisma.module';
import {
  PaymentRepository,
  OrderRepository,
  EnrollmentRepository,
} from '../database/repositories';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymentRepository,
    OrderRepository,
    EnrollmentRepository,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
