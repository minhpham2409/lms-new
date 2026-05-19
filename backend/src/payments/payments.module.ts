import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PrismaModule } from '../prisma/prisma.module';
import {
  PaymentRepository,
  OrderRepository,
  EnrollmentRepository,
  ParentChildRepository,
  NotificationRepository,
} from '../database/repositories';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymentRepository,
    OrderRepository,
    EnrollmentRepository,
    ParentChildRepository,
    NotificationRepository,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
