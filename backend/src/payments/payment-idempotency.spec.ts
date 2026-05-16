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
      findUnique: jest.fn(),
    },
    orderItem: {
      findMany: jest.fn(),
    },
    coupon: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    enrollment: {
      upsert: jest.fn(),
      updateMany: jest.fn(),
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

    it('should rollback when order is no longer pending', async () => {
      mockTx.payment.updateMany.mockResolvedValue({ count: 1 });
      mockTx.order.updateMany.mockResolvedValue({ count: 0 });

      await expect(repo.completePaymentTransaction(baseParams)).rejects.toThrow(
        'Order is no longer pending',
      );
      expect(mockTx.enrollment.upsert).not.toHaveBeenCalled();
    });

    it('should rollback when coupon maxUses is reached', async () => {
      mockTx.payment.updateMany.mockResolvedValue({ count: 1 });
      mockTx.order.updateMany.mockResolvedValue({ count: 1 });
      mockTx.coupon.findUnique.mockResolvedValue({ usedCount: 5, maxUses: 5 }); // Fully used
      mockTx.coupon.updateMany.mockResolvedValue({ count: 0 });
      mockTx.enrollment.upsert.mockResolvedValue({});

      await expect(
        repo.completePaymentTransaction({ ...baseParams, couponId: 'coupon-1' }),
      ).rejects.toThrow('Coupon usage limit reached');

      expect(mockTx.coupon.findUnique).toHaveBeenCalled();
      expect(mockTx.enrollment.upsert).not.toHaveBeenCalled();
    });

    it('should increment coupon when under maxUses', async () => {
      mockTx.payment.updateMany.mockResolvedValue({ count: 1 });
      mockTx.order.updateMany.mockResolvedValue({ count: 1 });
      mockTx.coupon.findUnique.mockResolvedValue({ usedCount: 2, maxUses: 5 });
      mockTx.coupon.updateMany.mockResolvedValue({ count: 1 });
      mockTx.enrollment.upsert.mockResolvedValue({});

      await repo.completePaymentTransaction({ ...baseParams, couponId: 'coupon-1' });

      expect(mockTx.coupon.updateMany).toHaveBeenCalledWith({
        where: { id: 'coupon-1', usedCount: { lt: 5 } },
        data: { usedCount: { increment: 1 } },
      });
    });

    it('should fail payment idempotently with conditional updates', async () => {
      mockTx.payment.updateMany.mockResolvedValue({ count: 1 });
      mockTx.order.updateMany.mockResolvedValue({ count: 1 });

      mockTx.orderItem.findMany.mockResolvedValue([{ courseId: 'course-1' }]);
      mockTx.order.findUnique.mockResolvedValue({ userId: 'user-1' });
      mockTx.enrollment.updateMany.mockResolvedValue({ count: 1 });

      const result = await repo.failPaymentTransaction({
        paymentId: 'payment-1',
        orderId: 'order-1',
      });

      expect(result).toEqual({ alreadyProcessed: false });
      expect(mockTx.payment.updateMany).toHaveBeenCalledWith({
        where: { id: 'payment-1', status: 'pending' },
        data: { status: 'failed' },
      });
      expect(mockTx.order.updateMany).toHaveBeenCalledWith({
        where: { id: 'order-1', status: 'pending' },
        data: { status: 'failed' },
      });
    });
  });
});
