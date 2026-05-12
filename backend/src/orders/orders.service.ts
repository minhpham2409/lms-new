import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderRepository, CartRepository, CouponRepository, EnrollmentRepository } from '../database/repositories';
import { AppEvents } from '../shared/events';
import { OrderCreatedPayload } from '../shared/events';
import { CreateOrderDto } from './dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly cartRepository: CartRepository,
    private readonly couponRepository: CouponRepository,
    private readonly enrollmentRepository: EnrollmentRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateOrderDto, userId: string) {
    const cartItems = await this.cartRepository.findByUser(userId);
    if (cartItems.length === 0) throw new BadRequestException('Cart is empty');

    // Filter out courses user is already enrolled in (race condition guard)
    const availableItems: typeof cartItems = [];
    for (const item of cartItems) {
      const enrolled = await this.enrollmentRepository.findByUserAndCourse(userId, item.courseId);
      if (!enrolled) availableItems.push(item);
    }

    if (availableItems.length === 0) {
      throw new BadRequestException('You are already enrolled in all courses in your cart');
    }

    const totalPrice = availableItems.reduce((sum, item) => sum + item.course.price, 0);
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
      // Streak coupons are personal — only the owner can use them
      if (coupon.type === 'streak' && coupon.userId && coupon.userId !== userId) {
        throw new BadRequestException('Mã giảm giá này không thuộc về bạn');
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
      items: availableItems.map(item => ({ courseId: item.courseId, price: item.course.price })),
    });

    await this.cartRepository.clearCart(userId);

    // Emit order created event
    this.eventEmitter.emit(AppEvents.ORDER_CREATED, {
      orderId: order.id,
      userId,
      totalPrice,
      finalPrice,
      courseIds: availableItems.map(item => item.courseId),
    } as OrderCreatedPayload);

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
