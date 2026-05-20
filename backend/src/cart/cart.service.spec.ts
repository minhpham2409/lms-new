import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CartService } from './cart.service';

describe('CartService', () => {
  let service: CartService;
  let cartRepository: {
    findByUser: jest.Mock;
    findByUserAndCourse: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    delete: jest.Mock;
    clearCart: jest.Mock;
  };
  let couponRepository: { findByCode: jest.Mock };
  let courseRepository: { findById: jest.Mock };
  let enrollmentRepository: { findByUserAndCourse: jest.Mock };

  beforeEach(() => {
    cartRepository = {
      findByUser: jest.fn(),
      findByUserAndCourse: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      clearCart: jest.fn(),
    };
    couponRepository = { findByCode: jest.fn() };
    courseRepository = { findById: jest.fn() };
    enrollmentRepository = { findByUserAndCourse: jest.fn() };

    service = new CartService(
      cartRepository as any,
      couponRepository as any,
      courseRepository as any,
      enrollmentRepository as any,
    );
  });

  // ─── getCart ─────────────────────────────────────────────────────────────────

  describe('getCart', () => {
    it('should return items and total', async () => {
      cartRepository.findByUser.mockResolvedValue([
        { id: 'item-1', course: { price: 100 } },
        { id: 'item-2', course: { price: 200 } },
      ]);

      const result = await service.getCart('user-1');

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(300);
    });

    it('should return empty cart with total 0', async () => {
      cartRepository.findByUser.mockResolvedValue([]);

      const result = await service.getCart('user-1');

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  // ─── addItem ────────────────────────────────────────────────────────────────

  describe('addItem', () => {
    it('should add a published course to cart', async () => {
      courseRepository.findById.mockResolvedValue({ id: 'course-1', status: 'published' });
      enrollmentRepository.findByUserAndCourse.mockResolvedValue(null);
      cartRepository.findByUserAndCourse.mockResolvedValue(null);
      cartRepository.create.mockResolvedValue({ id: 'cart-1', userId: 'user-1', courseId: 'course-1' });

      const result = await service.addItem({ courseId: 'course-1' }, 'user-1');

      expect(result.id).toBe('cart-1');
      expect(cartRepository.create).toHaveBeenCalledWith({ userId: 'user-1', courseId: 'course-1' });
    });

    it('should throw NotFoundException when course does not exist', async () => {
      courseRepository.findById.mockResolvedValue(null);

      await expect(service.addItem({ courseId: 'bad-id' }, 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for unpublished courses', async () => {
      courseRepository.findById.mockResolvedValue({ id: 'course-1', status: 'draft' });

      await expect(service.addItem({ courseId: 'course-1' }, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException when already enrolled', async () => {
      courseRepository.findById.mockResolvedValue({ id: 'course-1', status: 'published' });
      enrollmentRepository.findByUserAndCourse.mockResolvedValue({ id: 'enroll-1' });

      await expect(service.addItem({ courseId: 'course-1' }, 'user-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException when course already in cart', async () => {
      courseRepository.findById.mockResolvedValue({ id: 'course-1', status: 'published' });
      enrollmentRepository.findByUserAndCourse.mockResolvedValue(null);
      cartRepository.findByUserAndCourse.mockResolvedValue({ id: 'existing-item' });

      await expect(service.addItem({ courseId: 'course-1' }, 'user-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ─── removeItem ──────────────────────────────────────────────────────────────

  describe('removeItem', () => {
    it('should remove an item owned by the user', async () => {
      cartRepository.findById.mockResolvedValue({ id: 'item-1', userId: 'user-1' });
      cartRepository.delete.mockResolvedValue({ id: 'item-1' });

      await service.removeItem('item-1', 'user-1');

      expect(cartRepository.delete).toHaveBeenCalledWith('item-1');
    });

    it('should throw NotFoundException when item does not exist', async () => {
      cartRepository.findById.mockResolvedValue(null);

      await expect(service.removeItem('bad-id', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when item belongs to another user', async () => {
      cartRepository.findById.mockResolvedValue({ id: 'item-1', userId: 'other-user' });

      await expect(service.removeItem('item-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── applyCoupon ─────────────────────────────────────────────────────────────

  describe('applyCoupon', () => {
    it('should calculate discounted total for valid coupon', async () => {
      couponRepository.findByCode.mockResolvedValue({
        id: 'coupon-1',
        code: 'SAVE20',
        discount: 20,
        isActive: true,
        expiresAt: null,
        maxUses: null,
        usedCount: 0,
        type: 'general',
        userId: null,
      });
      cartRepository.findByUser.mockResolvedValue([
        { course: { price: 100, allowPlatformPromotions: true } },
        { course: { price: 200, allowPlatformPromotions: true } },
      ]);

      const result = await service.applyCoupon({ code: 'SAVE20' }, 'user-1');

      expect(result.originalTotal).toBe(300);
      expect(result.finalTotal).toBe(240);
      expect(result.savings).toBe(60);
      expect(result.discount).toBe(20);
    });

    it('should throw NotFoundException for inactive coupon', async () => {
      couponRepository.findByCode.mockResolvedValue({ isActive: false });

      await expect(service.applyCoupon({ code: 'DEAD' }, 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for expired coupon', async () => {
      couponRepository.findByCode.mockResolvedValue({
        isActive: true,
        expiresAt: new Date('2020-01-01'),
      });

      await expect(service.applyCoupon({ code: 'OLD' }, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when coupon usage limit is reached', async () => {
      couponRepository.findByCode.mockResolvedValue({
        isActive: true,
        expiresAt: null,
        maxUses: 5,
        usedCount: 5,
      });

      await expect(service.applyCoupon({ code: 'FULL' }, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject streak coupon used by non-owner', async () => {
      couponRepository.findByCode.mockResolvedValue({
        isActive: true,
        type: 'streak',
        userId: 'owner-1',
        expiresAt: null,
        maxUses: null,
        usedCount: 0,
      });

      await expect(service.applyCoupon({ code: 'STREAK' }, 'other-user')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject when cart contains courses that dont allow promotions', async () => {
      couponRepository.findByCode.mockResolvedValue({
        isActive: true,
        discount: 10,
        type: 'general',
        userId: null,
        expiresAt: null,
        maxUses: null,
        usedCount: 0,
      });
      cartRepository.findByUser.mockResolvedValue([
        { course: { price: 100, allowPlatformPromotions: false } },
      ]);

      await expect(service.applyCoupon({ code: 'PROMO' }, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── clearCart ─────────────────────────────────────────────────────────────

  describe('clearCart', () => {
    it('should delegate to repository', async () => {
      cartRepository.clearCart.mockResolvedValue({ count: 3 });

      await service.clearCart('user-1');

      expect(cartRepository.clearCart).toHaveBeenCalledWith('user-1');
    });
  });
});
