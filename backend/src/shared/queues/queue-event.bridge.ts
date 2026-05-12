import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { AppEvents } from '../../shared/events';
import {
  PaymentCompletedPayload,
  EnrollmentApprovedPayload,
} from '../../shared/events';
import { QueueNames, JobNames } from '../../shared/queues';

/**
 * Bridges Domain Events → Bull Background Queues.
 *
 * Listens to lightweight in-process events and dispatches heavy
 * async jobs (email, PDF, etc.) into Redis queues.
 * This keeps the API response fast while heavy work happens in the background.
 */
@Injectable()
export class QueueEventBridge {
  private readonly logger = new Logger(QueueEventBridge.name);

  constructor(
    @InjectQueue(QueueNames.EMAIL) private readonly emailQueue: Queue,
  ) {}

  /**
   * After a payment is confirmed, push an invoice email job into the queue.
   * The EmailProcessor will handle the actual sending asynchronously.
   */
  @OnEvent(AppEvents.PAYMENT_COMPLETED)
  async onPaymentCompleted(payload: PaymentCompletedPayload) {
    this.logger.log(
      `[Event→Queue] PAYMENT_COMPLETED → pushing invoice email job for order ${payload.orderId}`,
    );

    await this.emailQueue.add(
      JobNames.SEND_PAYMENT_INVOICE,
      {
        userId: payload.userId,
        orderId: payload.orderId,
        amount: payload.amount,
        courseIds: payload.courseIds,
        courseTitles: payload.courseTitles,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    this.logger.log(
      `[Event→Queue] Invoice email job queued for order ${payload.orderId}`,
    );
  }

  /**
   * After enrollment approval, push a confirmation email job.
   */
  @OnEvent(AppEvents.ENROLLMENT_APPROVED)
  async onEnrollmentApproved(payload: EnrollmentApprovedPayload) {
    this.logger.log(
      `[Event→Queue] ENROLLMENT_APPROVED → pushing confirmation email for user ${payload.userId}`,
    );

    await this.emailQueue.add(
      JobNames.SEND_ENROLLMENT_CONFIRMATION,
      {
        userId: payload.userId,
        courseTitle: payload.courseTitle,
        email: '', // Will be resolved by the processor from userId
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
      },
    );
  }
}
