import { PaymentRepository } from '../database/repositories/payment.repository';
import { PrismaService } from '../prisma/prisma.service';

describe('PaymentRepository — Idempotency', () => {
  let repo: PaymentRepository;
  let prismaService: jest.Mocked<Partial<PrismaService>>;

  const mockTx = {
    payment: {
      updateMany: jest.fn(),
      findUnique: jest.fn(),
    },
    order: {
      updateMany: jest.fn(),
    },
    coupon: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    enrollment: {
      upsert: jest.fn(),
    },
  };

  beforeEach(() => {
    prismaService = {
      $transaction: jest.fn().mockImplementation((fn) => fn(mockTx)),
    } as jest.Mocked<Partial<PrismaService>>;

    repo = new PaymentRepository(prismaService as PrismaService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('completePaymentTransaction', () => {
    const baseParams = {
      paymentId: 'payment-1',
      orderId: 'order-1',
      userId: 'user-1',
      courseItems: [{ courseId: 'course-1' }],
    };

    it('should complete successfully on first call', async () => {
      mockTx.payment.updateMany.mockResolvedValue({ count: 1 });
      mockTx.order.updateMany.mockResolvedValue({ count: 1 });
      mockTx.enrollment.upsert.mockResolvedValue({});

      const result = await repo.completePaymentTransaction(baseParams);
      expect(result).toEqual({ alreadyProcessed: false });
      expect(mockTx.payment.updateMany).toHaveBeenCalledWith({
        where: { id: 'payment-1', status: 'pending' },
        data: expect.objectContaining({ status: 'completed' }),
      });
    });

    it('should return alreadyProcessed=true on duplicate webhook', async () => {
      // Simulate: payment already completed → updateMany returns count=0
      mockTx.payment.updateMany.mockResolvedValue({ count: 0 });

      const result = await repo.completePaymentTransaction(baseParams);
      expect(result).toEqual({ alreadyProcessed: true });

      // Should NOT update order or increment coupon on duplicate
      expect(mockTx.order.updateMany).not.toHaveBeenCalled();
      expect(mockTx.coupon.update).not.toHaveBeenCalled();
      expect(mockTx.enrollment.upsert).not.toHaveBeenCalled();
    });

    it('should NOT increment coupon when maxUses is reached', async () => {
      mockTx.payment.updateMany.mockResolvedValue({ count: 1 });
      mockTx.order.updateMany.mockResolvedValue({ count: 1 });
      mockTx.coupon.findUnique.mockResolvedValue({ usedCount: 5, maxUses: 5 }); // Fully used
      mockTx.enrollment.upsert.mockResolvedValue({});

      await repo.completePaymentTransaction({ ...baseParams, couponId: 'coupon-1' });

      expect(mockTx.coupon.findUnique).toHaveBeenCalled();
      expect(mockTx.coupon.update).not.toHaveBeenCalled(); // Should NOT increment
    });

    it('should increment coupon when under maxUses', async () => {
      mockTx.payment.updateMany.mockResolvedValue({ count: 1 });
      mockTx.order.updateMany.mockResolvedValue({ count: 1 });
      mockTx.coupon.findUnique.mockResolvedValue({ usedCount: 2, maxUses: 5 });
      mockTx.coupon.update.mockResolvedValue({});
      mockTx.enrollment.upsert.mockResolvedValue({});

      await repo.completePaymentTransaction({ ...baseParams, couponId: 'coupon-1' });

      expect(mockTx.coupon.update).toHaveBeenCalledWith({
        where: { id: 'coupon-1' },
        data: { usedCount: { increment: 1 } },
      });
    });
  });
});
