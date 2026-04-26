import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CartRepository, CouponRepository } from '../database/repositories';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto, ApplyCouponDto } from './dto';

@Injectable()
export class CartService {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly couponRepository: CouponRepository,
    private readonly prisma: PrismaService,
  ) {}

  async getCart(userId: string) {
    const items = await this.cartRepository.findByUser(userId);
    const total = items.reduce((sum, item) => sum + item.course.price, 0);
    return { items, total };
  }

  async addItem(dto: AddToCartDto, userId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: dto.courseId } });
    if (!course) throw new NotFoundException('Course not found');
    if (course.status !== 'published') {
      throw new BadRequestException('This course is not available for purchase');
    }

    const enrolled = await this.prisma.enrollment.findFirst({
      where: { userId, courseId: dto.courseId },
    });
    if (enrolled) throw new ConflictException('You are already enrolled in this course');

    const existing = await this.cartRepository.findByUserAndCourse(userId, dto.courseId);
    if (existing) throw new ConflictException('Course is already in your cart');

    return this.cartRepository.create({ userId, courseId: dto.courseId });
  }

  async removeItem(itemId: string, userId: string) {
    const item = await this.cartRepository.findById(itemId);
    if (!item) throw new NotFoundException('Cart item not found');
    if (item.userId !== userId) throw new NotFoundException('Cart item not found');
    return this.cartRepository.delete(itemId);
  }

  async applyCoupon(dto: ApplyCouponDto, userId: string) {
    const coupon = await this.couponRepository.findByCode(dto.code);
    if (!coupon || !coupon.isActive) throw new NotFoundException('Coupon not found or inactive');
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      throw new BadRequestException('Coupon has expired');
    }
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException('Coupon usage limit reached');
    }

    const items = await this.cartRepository.findByUser(userId);
    const total = items.reduce((sum, item) => sum + item.course.price, 0);
    const finalTotal = total * (1 - coupon.discount / 100);

    return {
      code: coupon.code,
      discount: coupon.discount,
      originalTotal: total,
      finalTotal,
      savings: total - finalTotal,
    };
  }

  async clearCart(userId: string) {
    return this.cartRepository.clearCart(userId);
  }
}
