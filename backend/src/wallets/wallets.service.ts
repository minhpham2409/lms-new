import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Prisma, PayoutStatus } from '@prisma/client';
import {
  WalletRepository,
  SystemConfigRepository,
} from '../database/repositories';
import { AppEvents, PaymentCompletedPayload } from '../shared/events';

const DEFAULT_PLATFORM_FEE = 20; // 20%

@Injectable()
export class WalletsService {
  private readonly logger = new Logger(WalletsService.name);

  constructor(
    private readonly walletRepository: WalletRepository,
    private readonly systemConfigRepository: SystemConfigRepository,
  ) {}

  // ─── Event Listener: Auto-split revenue on payment ──────────────────

  @OnEvent(AppEvents.PAYMENT_COMPLETED)
  async onPaymentCompleted(payload: PaymentCompletedPayload) {
    this.logger.log(`[Revenue Split] Processing order ${payload.orderId}`);

    try {
      const feePercentage = await this.getPlatformFeePercentage();

      const result = await this.walletRepository.splitOrderRevenueAtomic({
        orderId: payload.orderId,
        feePercent: feePercentage,
      });

      this.logger.log(
        `[Revenue Split] Order ${result.orderId}: credited=${result.credited}, skipped=${result.skippedDuplicate}, total=${result.totalTeacherEarning}`,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `[Revenue Split] Failed for order ${payload.orderId}: ${message}`,
      );
    }
  }

  // ─── Teacher APIs ───────────────────────────────────────────────────

  async getMyWallet(userId: string) {
    const wallet = await this.walletRepository.findWithTransactions(userId);
    if (!wallet) {
      // Auto-create wallet if teacher never earned before
      const created = await this.walletRepository.findOrCreateByUserId(userId);
      return {
        ...created,
        balance: created.balance.toString(),
        pendingBalance: created.pendingBalance.toString(),
        totalEarned: created.totalEarned.toString(),
        transactions: [],
      };
    }

    // Serialize Decimal fields to string for safe JSON response
    return {
      ...wallet,
      balance: wallet.balance.toString(),
      pendingBalance: wallet.pendingBalance.toString(),
      totalEarned: wallet.totalEarned.toString(),
      transactions: wallet.transactions.map((t) => ({
        ...t,
        amount: t.amount.toString(),
      })),
    };
  }

  async requestPayout(userId: string, amount: string | number) {
    const decimalAmount = new Prisma.Decimal(amount.toString());

    if (decimalAmount.lte(0)) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    // Validate bank info via repository method (no private access)
    const bankInfo = await this.walletRepository.getUserBankInfo(userId);
    if (!bankInfo?.bankAccount || !bankInfo?.bankName) {
      throw new BadRequestException(
        'Please set up your bank information before requesting a payout',
      );
    }

    try {
      const result = await this.walletRepository.requestPayoutAtomic({
        userId,
        amount: decimalAmount,
        bankDetails: {
          bankName: bankInfo.bankName,
          bankAccount: bankInfo.bankAccount,
          bankOwner: bankInfo.bankOwner ?? '',
        },
      });

      this.logger.log(
        `[Payout] Teacher ${userId} requested ${decimalAmount.toString()}`,
      );

      return {
        wallet: {
          ...result.wallet,
          balance: result.wallet.balance.toString(),
          pendingBalance: result.wallet.pendingBalance.toString(),
          totalEarned: result.wallet.totalEarned.toString(),
        },
        payout: {
          ...result.payout,
          amount: result.payout.amount.toString(),
        },
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new BadRequestException(message);
    }
  }

  async updateBankInfo(
    userId: string,
    data: { bankName: string; bankAccount: string; bankOwner: string },
  ) {
    return this.walletRepository.updateUserBankInfo(userId, data);
  }

  // ─── Admin APIs ────────────────────────────────────────────────────

  async getAllPayouts(params: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    // Validate status is a valid PayoutStatus enum if provided
    let payoutStatus: PayoutStatus | undefined;
    if (params.status) {
      const validStatuses = Object.values(PayoutStatus);
      if (!validStatuses.includes(params.status as PayoutStatus)) {
        throw new BadRequestException(
          `Invalid status. Valid values: ${validStatuses.join(', ')}`,
        );
      }
      payoutStatus = params.status as PayoutStatus;
    }

    const result = await this.walletRepository.listPayoutsPaginated({
      page: params.page,
      limit: params.limit,
      status: payoutStatus,
    });

    // Serialize Decimal in response
    return {
      data: result.data.map((p) => ({
        ...p,
        amount: p.amount.toString(),
      })),
      meta: result.meta,
    };
  }

  async approvePayout(payoutId: string) {
    try {
      const result = await this.walletRepository.approvePayoutAtomic(payoutId);
      this.logger.log(`[Payout] Admin approved payout ${payoutId}`);
      return {
        ...result,
        amount: result.amount.toString(),
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new BadRequestException(message);
    }
  }

  async rejectPayout(payoutId: string, adminNote?: string) {
    try {
      const result = await this.walletRepository.rejectPayoutAtomic(
        payoutId,
        adminNote,
      );
      this.logger.log(
        `[Payout] Admin rejected payout ${payoutId}: ${adminNote ?? ''}`,
      );
      return {
        ...result,
        amount: result.amount.toString(),
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new BadRequestException(message);
    }
  }

  // ─── System Config ─────────────────────────────────────────────────

  async getPlatformFeePercentage(): Promise<number> {
    const config =
      await this.systemConfigRepository.getByKey('platformFeePercentage');
    if (!config) return DEFAULT_PLATFORM_FEE;
    return Number(config.value) || DEFAULT_PLATFORM_FEE;
  }

  async updatePlatformFee(percentage: number) {
    if (percentage < 0 || percentage > 100) {
      throw new BadRequestException(
        'Fee percentage must be between 0 and 100',
      );
    }
    return this.systemConfigRepository.upsertByKey(
      'platformFeePercentage',
      percentage,
      'Platform commission fee percentage',
    );
  }
}
