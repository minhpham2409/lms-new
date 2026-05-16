import { createHmac } from 'crypto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaymentsService } from './payments.service';
import { PaymentRepository, OrderRepository, EnrollmentRepository } from '../database/repositories';
import { AppEvents } from '../shared/events';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let paymentRepository: {
    createWebhookEvent: jest.Mock;
    updateWebhookEventStatus: jest.Mock;
    findByTxnRef: jest.Mock;
    completePaymentTransaction: jest.Mock;
    failPaymentTransaction: jest.Mock;
  };
  let orderRepository: { findByIdWithDetails: jest.Mock };
  let eventEmitter: { emit: jest.Mock };

  beforeEach(() => {
    process.env.WEBHOOK_SECRET = 'test-webhook-secret';
    paymentRepository = {
      createWebhookEvent: jest.fn().mockResolvedValue({
        duplicate: false,
        event: { id: 'event-1' },
      }),
      updateWebhookEventStatus: jest.fn().mockResolvedValue({}),
      findByTxnRef: jest.fn(),
      completePaymentTransaction: jest.fn().mockResolvedValue({ alreadyProcessed: false }),
      failPaymentTransaction: jest.fn().mockResolvedValue({ alreadyProcessed: false }),
    };
    orderRepository = {
      findByIdWithDetails: jest.fn(),
    };
    eventEmitter = { emit: jest.fn() };

    service = new PaymentsService(
      paymentRepository as unknown as PaymentRepository,
      orderRepository as unknown as OrderRepository,
      {} as EnrollmentRepository,
      eventEmitter as unknown as EventEmitter2,
    );
  });

  afterEach(() => {
    delete process.env.WEBHOOK_SECRET;
  });

  function sign(txnRef: string, amount: number, status: string) {
    return createHmac('sha256', 'test-webhook-secret')
      .update(`${txnRef}|${amount}|${status}`)
      .digest('hex');
  }

  it('completes payment, enrolls user, and emits payment completed event', async () => {
    paymentRepository.findByTxnRef.mockResolvedValue({
      id: 'payment-1',
      orderId: 'order-1',
      amount: 100,
      status: 'pending',
    });
    orderRepository.findByIdWithDetails.mockResolvedValue({
      id: 'order-1',
      userId: 'student-1',
      status: 'pending',
      finalPrice: 100,
      couponId: null,
      items: [
        { courseId: 'course-1', course: { title: 'Course 1' } },
      ],
    });

    const result = await service.handleWebhook({
      txnRef: 'txn-1',
      amount: 100,
      status: 'success',
      signature: sign('txn-1', 100, 'success'),
    });

    expect(result).toEqual({ message: 'Payment confirmed, enrollments created' });
    expect(paymentRepository.completePaymentTransaction).toHaveBeenCalledWith({
      paymentId: 'payment-1',
      orderId: 'order-1',
      userId: 'student-1',
      courseItems: [{ courseId: 'course-1' }],
      couponId: undefined,
    });
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      AppEvents.PAYMENT_COMPLETED,
      expect.objectContaining({
        paymentId: 'payment-1',
        orderId: 'order-1',
        userId: 'student-1',
        courseIds: ['course-1'],
      }),
    );
  });

  it('rejects amount mismatch without completing payment', async () => {
    paymentRepository.findByTxnRef.mockResolvedValue({
      id: 'payment-1',
      orderId: 'order-1',
      amount: 100,
      status: 'pending',
    });
    orderRepository.findByIdWithDetails.mockResolvedValue({
      id: 'order-1',
      userId: 'student-1',
      status: 'pending',
      finalPrice: 100,
      items: [{ courseId: 'course-1' }],
    });

    const result = await service.handleWebhook({
      txnRef: 'txn-1',
      amount: 50,
      status: 'success',
      signature: sign('txn-1', 50, 'success'),
    });

    expect(result).toEqual({ message: 'Amount mismatch — payment rejected for review' });
    expect(paymentRepository.completePaymentTransaction).not.toHaveBeenCalled();
    expect(paymentRepository.updateWebhookEventStatus).toHaveBeenCalledWith(
      'event-1',
      'rejected',
      'Amount mismatch: expected 100, got 50',
    );
  });

  it('ignores duplicate webhook events before mutating payment state', async () => {
    paymentRepository.createWebhookEvent.mockResolvedValue({
      duplicate: true,
      event: null,
    });

    const result = await service.handleWebhook({
      txnRef: 'txn-1',
      amount: 100,
      status: 'success',
      signature: sign('txn-1', 100, 'success'),
    });

    expect(result).toEqual({ message: 'Duplicate webhook ignored' });
    expect(paymentRepository.findByTxnRef).not.toHaveBeenCalled();
    expect(paymentRepository.completePaymentTransaction).not.toHaveBeenCalled();
  });
});
