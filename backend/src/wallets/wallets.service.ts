import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WalletRepository, SystemConfigRepository, CourseRepository } from '../database/repositories';
import { AppEvents, PaymentCompletedPayload } from '../shared/events';
import { OrderRepository } from '../database/repositories';

const DEFAULT_PLATFORM_FEE = 20; // 20%

@Injectable()
export class WalletsService {
  private readonly logger = new Logger(WalletsService.name);

  constructor(
    private readonly walletRepository: WalletRepository,
    private readonly systemConfigRepository: SystemConfigRepository,
    private readonly orderRepository: OrderRepository,
    private readonly courseRepository: CourseRepository,
  ) {}

  // ─── Event Listener: Auto-split revenue on payment ──────────────────
  @OnEvent(AppEvents.PAYMENT_COMPLETED)
  async onPaymentCompleted(payload: PaymentCompletedPayload) {
    this.logger.log(`[Revenue Split] Processing order ${payload.orderId}`);

    const feePercentage = await this.getPlatformFeePercentage();
    const order = await this.orderRepository.findByIdWithDetails(payload.orderId);
    if (!order || !order.items) {
      this.logger.warn(`[Revenue Split] Order ${payload.orderId} not found or has no items`);
      return;
    }

    for (const item of order.items) {
      const course = await this.courseRepository.findById(item.courseId);
      if (!course) continue;

      const itemPrice = Number(item.price ?? course.price);
      const platformCut = (itemPrice * feePercentage) / 100;
      const teacherEarning = itemPrice - platformCut;

      if (teacherEarning <= 0) continue;

      try {
        await this.walletRepository.addEarning({
          userId: course.authorId,
          amount: teacherEarning,
          referenceId: payload.orderId,
          description: `Bán khóa "${course.title}" — đơn #${payload.orderId.substring(0, 8)}`,
        });

        this.logger.log(
          `[Revenue Split] +${teacherEarning} → Teacher ${course.authorId} (course: ${course.title}, fee: ${feePercentage}%)`,
        );
      } catch (err) {
        this.logger.error(
          `[Revenue Split] Failed for teacher ${course.authorId}: ${err.message}`,
        );
      }
    }
  }

  // ─── Teacher APIs ───────────────────────────────────────────────────
  async getMyWallet(userId: string) {
    const wallet = await this.walletRepository.findWithTransactions(userId);
    if (!wallet) {
      // Auto-create wallet if teacher never earned before
      return this.walletRepository.findOrCreateByUserId(userId);
    }
    return wallet;
  }

  async requestPayout(userId: string, amount: number) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const wallet = await this.walletRepository.findOrCreateByUserId(userId);
    if (Number(wallet.balance) < amount) {
      throw new BadRequestException(
        `Insufficient balance. Available: ${wallet.balance}, Requested: ${amount}`,
      );
    }

    // Need bank info
    const user = await this.walletRepository['prisma'].user.findUnique({
      where: { id: userId },
      select: { bankName: true, bankAccount: true, bankOwner: true },
    });

    if (!user?.bankAccount || !user?.bankName) {
      throw new BadRequestException(
        'Please set up your bank information before requesting a payout',
      );
    }

    const result = await this.walletRepository.requestPayout({
      userId,
      amount,
      bankDetails: {
        bankName: user.bankName,
        bankAccount: user.bankAccount,
        bankOwner: user.bankOwner,
      },
    });

    this.logger.log(`[Payout] Teacher ${userId} requested ${amount}`);
    return result;
  }

  async updateBankInfo(userId: string, data: { bankName: string; bankAccount: string; bankOwner: string }) {
    return this.walletRepository['prisma'].user.update({
      where: { id: userId },
      data: {
        bankName: data.bankName,
        bankAccount: data.bankAccount,
        bankOwner: data.bankOwner,
      },
      select: { id: true, bankName: true, bankAccount: true, bankOwner: true },
    });
  }

  // ─── Admin APIs ────────────────────────────────────────────────────
  async getAllPayouts(params: { page?: number; limit?: number; status?: string }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = params.status ? { status: params.status } : {};

    const [data, total] = await Promise.all([
      this.walletRepository['prisma'].payoutRequest.findMany({
        where,
        include: {
          user: {
            select: {
              id: true, username: true, firstName: true, lastName: true,
              bankName: true, bankAccount: true, bankOwner: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.walletRepository['prisma'].payoutRequest.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async approvePayout(payoutId: string) {
    try {
      const result = await this.walletRepository.approvePayout(payoutId);
      this.logger.log(`[Payout] Admin approved payout ${payoutId}`);
      return result;
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async rejectPayout(payoutId: string, adminNote?: string) {
    try {
      const result = await this.walletRepository.rejectPayout(payoutId, adminNote);
      this.logger.log(`[Payout] Admin rejected payout ${payoutId}: ${adminNote}`);
      return result;
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  // ─── System Config ─────────────────────────────────────────────────
  async getPlatformFeePercentage(): Promise<number> {
    const config = await this.systemConfigRepository.getByKey('platformFeePercentage');
    if (!config) return DEFAULT_PLATFORM_FEE;
    return Number(config.value) || DEFAULT_PLATFORM_FEE;
  }

  async updatePlatformFee(percentage: number) {
    if (percentage < 0 || percentage > 100) {
      throw new BadRequestException('Fee percentage must be between 0 and 100');
    }
    return this.systemConfigRepository.upsertByKey(
      'platformFeePercentage',
      percentage,
      'Platform commission fee percentage',
    );
  }
}
