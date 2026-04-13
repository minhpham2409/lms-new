import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CouponRepository } from '../database/repositories';
import { CreateCouponDto } from './dto';

@Injectable()
export class CouponsService {
  constructor(private readonly couponRepository: CouponRepository) {}

  async create(dto: CreateCouponDto) {
    const existing = await this.couponRepository.findByCode(dto.code);
    if (existing) throw new ConflictException('Coupon code already exists');

    return this.couponRepository.create({
      code: dto.code.toUpperCase(),
      discount: dto.discount,
      maxUses: dto.maxUses,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      isActive: dto.isActive ?? true,
    });
  }

  async findAll() {
    return this.couponRepository.findAll();
  }

  async findByCode(code: string) {
    const coupon = await this.couponRepository.findByCode(code.toUpperCase());
    if (!coupon) throw new NotFoundException('Coupon not found');
    if (!coupon.isActive) throw new BadRequestException('Coupon is inactive');
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      throw new BadRequestException('Coupon has expired');
    }
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException('Coupon usage limit reached');
    }
    return coupon;
  }
}
