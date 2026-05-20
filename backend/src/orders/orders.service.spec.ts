import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AppEvents } from '../shared/events';

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepo: {
    createOrderTransaction: jest.Mock;
    findByUser: jest.Mock;
    findByIdWithDetails: jest.Mock;
  };
  let cartRepo: { findByUser: jest.Mock };
  let couponRepo: { findByCode: jest.Mock };
  let enrollmentRepo: { findByUserAndCourse: jest.Mock };
  let eventEmitter: { emit: jest.Mock };

  beforeEach(() => {
    orderRepo = {
      createOrderTransaction: jest.fn(),
      findByUser: jest.fn(),
      findByIdWithDetails: jest.fn(),
    };
    cartRepo = { findByUser: jest.fn() };
    couponRepo = { findByCode: jest.fn() };
    enrollmentRepo = { findByUserAndCourse: jest.fn() };
    eventEmitter = { emit: jest.fn() };

    service = new OrdersService(
      orderRepo as any,
      cartRepo as any,
      couponRepo as any,
      enrollmentRepo as any,
      eventEmitter as any,
    );
  });

  // ─── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create an order from cart items', async () => {
      cartRepo.findByUser.mockResolvedValue([
        { courseId: 'c1', course: { price: 100, allowPlatformPromotions: true } },
        { courseId: 'c2', course: { price: 200, allowPlatformPromotions: true } },
      ]);
      enrollmentRepo.findByUserAndCourse.mockResolvedValue(null);
      orderRepo.createOrderTransaction.mockResolvedValue({ id: 'order-1' });

      const result = await service.create({}, 'user-1');

      expect(result.id).toBe('order-1');
      expect(orderRepo.createOrderTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          totalPrice: 300,
          finalPrice: 300,
          items: [
            { courseId: 'c1', price: 100 },
            { courseId: 'c2', price: 200 },
          ],
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        AppEvents.ORDER_CREATED,
        expect.objectContaining({ orderId: 'order-1', totalPrice: 300 }),
      );
    });

    it('should throw BadRequestException when cart is empty', async () => {
      cartRepo.findByUser.mockResolvedValue([]);

      await expect(service.create({}, 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should skip already-enrolled courses and throw if none remain', async () => {
      cartRepo.findByUser.mockResolvedValue([
        { courseId: 'c1', course: { price: 100 } },
      ]);
      enrollmentRepo.findByUserAndCourse.mockResolvedValue({ status: 'active' });

      await expect(service.create({}, 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should apply a valid coupon to discount the order', async () => {
      cartRepo.findByUser.mockResolvedValue([
        { courseId: 'c1', course: { price: 200, allowPlatformPromotions: true } },
      ]);
      enrollmentRepo.findByUserAndCourse.mockResolvedValue(null);
      couponRepo.findByCode.mockResolvedValue({
        id: 'coupon-1',
        code: 'SAVE50',
        discount: 50,
        isActive: true,
        expiresAt: null,
        maxUses: null,
        usedCount: 0,
        type: 'general',
        userId: null,
      });
      orderRepo.createOrderTransaction.mockResolvedValue({ id: 'order-1' });

      await service.create({ couponCode: 'SAVE50' }, 'user-1');

      expect(orderRepo.createOrderTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          totalPrice: 200,
          finalPrice: 100,
          couponId: 'coupon-1',
        }),
      );
    });

    it('should reject expired coupon', async () => {
      cartRepo.findByUser.mockResolvedValue([
        { courseId: 'c1', course: { price: 100 } },
      ]);
      enrollmentRepo.findByUserAndCourse.mockResolvedValue(null);
      couponRepo.findByCode.mockResolvedValue({
        isActive: true,
        expiresAt: new Date('2020-01-01'),
      });

      await expect(service.create({ couponCode: 'OLD' }, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject coupon at usage limit', async () => {
      cartRepo.findByUser.mockResolvedValue([
        { courseId: 'c1', course: { price: 100 } },
      ]);
      enrollmentRepo.findByUserAndCourse.mockResolvedValue(null);
      couponRepo.findByCode.mockResolvedValue({
        isActive: true,
        expiresAt: null,
        maxUses: 5,
        usedCount: 5,
      });

      await expect(service.create({ couponCode: 'FULL' }, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject streak coupon used by non-owner', async () => {
      cartRepo.findByUser.mockResolvedValue([
        { courseId: 'c1', course: { price: 100, allowPlatformPromotions: true } },
      ]);
      enrollmentRepo.findByUserAndCourse.mockResolvedValue(null);
      couponRepo.findByCode.mockResolvedValue({
        id: 'coupon-1',
        isActive: true,
        expiresAt: null,
        maxUses: null,
        usedCount: 0,
        discount: 10,
        type: 'streak',
        userId: 'owner-1',
      });

      await expect(service.create({ couponCode: 'STREAK' }, 'other-user')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject coupon when course disallows promotions', async () => {
      cartRepo.findByUser.mockResolvedValue([
        { courseId: 'c1', course: { price: 100, allowPlatformPromotions: false } },
      ]);
      enrollmentRepo.findByUserAndCourse.mockResolvedValue(null);
      couponRepo.findByCode.mockResolvedValue({
        id: 'coupon-1',
        isActive: true,
        discount: 10,
        type: 'general',
        userId: null,
        expiresAt: null,
        maxUses: null,
        usedCount: 0,
      });

      await expect(service.create({ couponCode: 'PROMO' }, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── findOne ────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return order for the owner', async () => {
      orderRepo.findByIdWithDetails.mockResolvedValue({ id: 'order-1', userId: 'user-1' });

      const result = await service.findOne('order-1', 'user-1');

      expect(result.id).toBe('order-1');
    });

    it('should throw NotFoundException when order does not exist', async () => {
      orderRepo.findByIdWithDetails.mockResolvedValue(null);

      await expect(service.findOne('bad-id', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when order belongs to another user', async () => {
      orderRepo.findByIdWithDetails.mockResolvedValue({ id: 'order-1', userId: 'other-user' });

      await expect(service.findOne('order-1', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });
});
