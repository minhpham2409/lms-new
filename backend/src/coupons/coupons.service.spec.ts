import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CouponsService } from './coupons.service';

describe('CouponsService', () => {
  let service: CouponsService;
  let couponRepo: {
    findByCode: jest.Mock;
    create: jest.Mock;
    findAll: jest.Mock;
    findByUserId: jest.Mock;
  };

  beforeEach(() => {
    couponRepo = {
      findByCode: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      findByUserId: jest.fn(),
    };
    service = new CouponsService(couponRepo as any);
  });

  // ─── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create a new coupon', async () => {
      couponRepo.findByCode.mockResolvedValue(null);
      couponRepo.create.mockResolvedValue({ id: 'coupon-1', code: 'WELCOME10' });

      const result = await service.create({
        code: 'welcome10',
        discount: 10,
      });

      expect(result.code).toBe('WELCOME10');
      expect(couponRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'WELCOME10',
          discount: 10,
          isActive: true,
        }),
      );
    });

    it('should throw ConflictException for duplicate code', async () => {
      couponRepo.findByCode.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create({ code: 'EXISTING', discount: 10 }),
      ).rejects.toThrow(ConflictException);
    });

    it('should pass expiresAt as Date when provided', async () => {
      couponRepo.findByCode.mockResolvedValue(null);
      couponRepo.create.mockResolvedValue({ id: 'coupon-2' });

      await service.create({
        code: 'EXPIRY',
        discount: 20,
        expiresAt: '2026-12-31',
      });

      expect(couponRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          expiresAt: expect.any(Date),
        }),
      );
    });
  });

  // ─── findByCode ─────────────────────────────────────────────────────────────

  describe('findByCode', () => {
    it('should return a valid coupon', async () => {
      couponRepo.findByCode.mockResolvedValue({
        id: 'coupon-1',
        code: 'VALID',
        isActive: true,
        expiresAt: null,
        maxUses: null,
        usedCount: 0,
      });

      const result = await service.findByCode('valid');

      expect(result.code).toBe('VALID');
    });

    it('should throw NotFoundException when coupon not found', async () => {
      couponRepo.findByCode.mockResolvedValue(null);

      await expect(service.findByCode('MISSING')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for inactive coupon', async () => {
      couponRepo.findByCode.mockResolvedValue({ isActive: false });

      await expect(service.findByCode('INACTIVE')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for expired coupon', async () => {
      couponRepo.findByCode.mockResolvedValue({
        isActive: true,
        expiresAt: new Date('2020-01-01'),
      });

      await expect(service.findByCode('EXPIRED')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when usage limit reached', async () => {
      couponRepo.findByCode.mockResolvedValue({
        isActive: true,
        expiresAt: null,
        maxUses: 3,
        usedCount: 3,
      });

      await expect(service.findByCode('USED')).rejects.toThrow(BadRequestException);
    });
  });

  // ─── findUserCoupons ───────────────────────────────────────────────────────

  describe('findUserCoupons', () => {
    it('should filter out expired and fully-used coupons', async () => {
      const now = new Date();
      couponRepo.findByUserId.mockResolvedValue([
        { id: '1', expiresAt: new Date(now.getTime() + 86400000), maxUses: 5, usedCount: 2 }, // valid
        { id: '2', expiresAt: new Date('2020-01-01'), maxUses: null, usedCount: 0 }, // expired
        { id: '3', expiresAt: null, maxUses: 3, usedCount: 3 }, // fully used
        { id: '4', expiresAt: null, maxUses: null, usedCount: 0 }, // valid
      ]);

      const result = await service.findUserCoupons('user-1');

      expect(result).toHaveLength(2);
      expect(result.map((c: any) => c.id)).toEqual(['1', '4']);
    });
  });
});
