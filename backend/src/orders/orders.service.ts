import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { OrderRepository, CartRepository, CouponRepository } from '../database/repositories';
import { CreateOrderDto } from './dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly cartRepository: CartRepository,
    private readonly couponRepository: CouponRepository,
  ) {}

  async create(dto: CreateOrderDto, userId: string) {
    const cartItems = await this.cartRepository.findByUser(userId);
    if (cartItems.length === 0) throw new BadRequestException('Cart is empty');

    const totalPrice = cartItems.reduce((sum, item) => sum + item.course.price, 0);
    let finalPrice = totalPrice;
    let couponId: string | undefined;

    if (dto.couponCode) {
      const coupon = await this.couponRepository.findByCode(dto.couponCode);
      if (!coupon || !coupon.isActive) throw new NotFoundException('Coupon not found or inactive');
      if (coupon.expiresAt && coupon.expiresAt < new Date()) {
        throw new BadRequestException('Coupon has expired');
      }
      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        throw new BadRequestException('Coupon usage limit reached');
      }
      finalPrice = totalPrice * (1 - coupon.discount / 100);
      couponId = coupon.id;
      await this.couponRepository.incrementUsed(coupon.id);
    }

    const order = await this.orderRepository.createWithItems({
      userId,
      couponId,
      totalPrice,
      finalPrice,
      items: cartItems.map(item => ({ courseId: item.courseId, price: item.course.price })),
    });

    await this.cartRepository.clearCart(userId);

    return order;
  }

  async findMyOrders(userId: string) {
    return this.orderRepository.findByUser(userId);
  }

  async findOne(id: string, userId: string) {
    const order = await this.orderRepository.findByIdWithDetails(id);
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new NotFoundException('Order not found');
    return order;
  }
}
