import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { OnEvent } from '@nestjs/event-emitter';
import { Queue } from 'bull';
import { Prisma, PayoutStatus } from '@prisma/client';
import {
  WalletRepository,
  SystemConfigRepository,
} from '../database/repositories';
import { AppEvents, PaymentCompletedPayload } from '../shared/events';
import { JobNames, QueueNames } from '../shared/queues';

const DEFAULT_PLATFORM_FEE = 20; // 20%
const REVENUE_SPLIT_ATTEMPTS = 5;

@Injectable()
export class WalletsService {
  private readonly logger = new Logger(WalletsService.name);

  constructor(
    private readonly walletRepository: WalletRepository,
    private readonly systemConfigRepository: SystemConfigRepository,
    @InjectQueue(QueueNames.WALLET) private readonly walletQueue: Queue,
  ) {}

  // ─── Event Listener: Auto-split revenue on payment ──────────────────

  @OnEvent(AppEvents.PAYMENT_COMPLETED)
  async onPaymentCompleted(payload: PaymentCompletedPayload) {
    await this.walletQueue.add(
      JobNames.SPLIT_ORDER_REVENUE,
      { orderId: payload.orderId },
      {
        jobId: `revenue:${payload.orderId}`,
        attempts: REVENUE_SPLIT_ATTEMPTS,
        backoff: { type: 'exponential', delay: 30_000 },
        removeOnComplete: false,
        removeOnFail: false,
      },
    );
    this.logger.log(`[Revenue Split] Queued order ${payload.orderId}`);
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

  async approvePayout(payoutId: string, adminId: string, bankTransferRef?: string, adminNote?: string) {
    try {
      const result = await this.walletRepository.approvePayoutAtomic(payoutId, {
        adminId,
        bankTransferRef,
        adminNote,
      });
      this.logger.log(`[Payout] Admin ${adminId} approved payout ${payoutId}`);
      return {
        ...result,
        amount: result.amount.toString(),
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new BadRequestException(message);
    }
  }

  async rejectPayout(payoutId: string, adminId: string, adminNote?: string) {
    try {
      const result = await this.walletRepository.rejectPayoutAtomic(
        payoutId,
        { adminId, adminNote },
      );
      this.logger.log(
        `[Payout] Admin ${adminId} rejected payout ${payoutId}: ${adminNote ?? ''}`,
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

  async getMyPayouts(userId: string) {
    const payouts = await this.walletRepository.findPayoutsByUser(userId);
    return payouts.map((p) => ({
      ...p,
      amount: p.amount.toString(),
    }));
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
