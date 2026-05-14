import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseRepository } from './base.repository';
import {
  Wallet,
  WalletTransactionType,
  PayoutStatus,
  Prisma,
} from '@prisma/client';

/**
 * Decimal helper – ensures we never use JS floating-point for money.
 * Accepts string | number | Prisma.Decimal, always returns Prisma.Decimal.
 */
function toDecimal(value: string | number | Prisma.Decimal): Prisma.Decimal {
  return new Prisma.Decimal(value.toString());
}

/** Result returned from splitOrderRevenueAtomic */
export interface RevenueSplitResult {
  orderId: string;
  credited: number;
  skippedDuplicate: number;
  totalTeacherEarning: string; // serialized Decimal
}

@Injectable()
export class WalletRepository extends BaseRepository<Wallet> {
  private readonly logger = new Logger(WalletRepository.name);

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  get model() {
    return this.prisma.wallet;
  }

  // ─── Wallet CRUD ───────────────────────────────────────────────────────

  /** Find wallet by userId, auto-create if not exists */
  async findOrCreateByUserId(userId: string): Promise<Wallet> {
    let wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { userId, balance: 0, pendingBalance: 0, totalEarned: 0 },
      });
      this.logger.log(`Created wallet for user ${userId}`);
    }
    return wallet;
  }

  /** Find wallet with recent transactions */
  async findWithTransactions(userId: string, limit = 20, offset = 0) {
    return this.prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        },
      },
    });
  }

  // ─── Bank Info (clean boundary — no private access) ────────────────────

  async getUserBankInfo(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, bankName: true, bankAccount: true, bankOwner: true },
    });
  }

  async updateUserBankInfo(
    userId: string,
    data: { bankName: string; bankAccount: string; bankOwner: string },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        bankName: data.bankName,
        bankAccount: data.bankAccount,
        bankOwner: data.bankOwner,
      },
      select: { id: true, bankName: true, bankAccount: true, bankOwner: true },
    });
  }

  // ─── Paginated Payouts (Admin) ─────────────────────────────────────────

  async listPayoutsPaginated(params: {
    page?: number;
    limit?: number;
    status?: PayoutStatus;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.PayoutRequestWhereInput = params.status
      ? { status: params.status }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.payoutRequest.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              bankName: true,
              bankAccount: true,
              bankOwner: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payoutRequest.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── Idempotent Atomic Revenue Split ──────────────────────────────────

  /**
   * ATOMIC: Split revenue from a paid order across all course teachers.
   *
   * Uses a single Prisma interactive transaction for ALL items.
   * If fail mid-way (non-duplicate error) → entire transaction rolls back.
   * Duplicate events are handled by unique constraint on idempotencyKey.
   *
   * @returns credited count, skipped count, total earnings
   */
  async splitOrderRevenueAtomic(params: {
    orderId: string;
    feePercent: Prisma.Decimal | string | number;
  }): Promise<RevenueSplitResult> {
    const feePercent = toDecimal(params.feePercent);
    const hundred = toDecimal(100);

    return this.prisma.$transaction(async (tx) => {
      // Load order with items + course + author
      const order = await tx.order.findUnique({
        where: { id: params.orderId },
        include: {
          items: {
            include: {
              course: {
                select: { id: true, title: true, authorId: true, price: true },
              },
            },
          },
        },
      });

      if (!order) {
        throw new Error(`Order ${params.orderId} not found`);
      }

      if (order.status !== 'paid') {
        throw new Error(
          `Order ${params.orderId} is not paid (status: ${order.status})`,
        );
      }

      let credited = 0;
      let skippedDuplicate = 0;
      let totalTeacherEarning = toDecimal(0);

      for (const item of order.items) {
        if (!item.course) continue;

        const itemPrice = toDecimal(item.price ?? item.course.price);
        const platformCut = itemPrice.mul(feePercent).div(hundred);
        const teacherEarning = itemPrice.minus(platformCut);

        if (teacherEarning.lte(0)) continue;

        const idempotencyKey = `revenue:${params.orderId}:${item.course.id}:${item.course.authorId}`;

        try {
          // Upsert teacher wallet
          const wallet = await tx.wallet.upsert({
            where: { userId: item.course.authorId },
            create: {
              userId: item.course.authorId,
              balance: teacherEarning,
              totalEarned: teacherEarning,
              pendingBalance: 0,
            },
            update: {
              balance: { increment: teacherEarning },
              totalEarned: { increment: teacherEarning },
            },
          });

          // Create transaction log with idempotencyKey
          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              amount: teacherEarning,
              type: WalletTransactionType.EARNING,
              referenceId: params.orderId,
              idempotencyKey,
              description: `Bán khóa "${item.course.title}" — đơn #${params.orderId.substring(0, 8)}`,
            },
          });

          credited++;
          totalTeacherEarning = totalTeacherEarning.plus(teacherEarning);
        } catch (err: unknown) {
          // Unique constraint violation on idempotencyKey → duplicate, skip safely
          if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === 'P2002'
          ) {
            skippedDuplicate++;

            // IMPORTANT: We already incremented balance above via upsert.
            // On duplicate, we need to revert the balance increment.
            // Since the create failed, we need to decrement what we added.
            await tx.wallet.update({
              where: { userId: item.course.authorId },
              data: {
                balance: { decrement: teacherEarning },
                totalEarned: { decrement: teacherEarning },
              },
            });

            continue;
          }
          // Any other error → rethrow to rollback the entire transaction
          throw err;
        }
      }

      return {
        orderId: params.orderId,
        credited,
        skippedDuplicate,
        totalTeacherEarning: totalTeacherEarning.toString(),
      };
    });
  }

  // ─── Payout: Request ──────────────────────────────────────────────────

  /**
   * ATOMIC: Request payout — deduct balance, add to pendingBalance.
   * Balance MUST NOT go negative.
   */
  async requestPayoutAtomic(params: {
    userId: string;
    amount: Prisma.Decimal | string | number;
    bankDetails: { bankName: string; bankAccount: string; bankOwner: string };
  }) {
    const amount = toDecimal(params.amount);

    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId: params.userId },
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const currentBalance = toDecimal(wallet.balance);
      if (currentBalance.lt(amount)) {
        throw new Error(
          `Insufficient balance. Available: ${currentBalance.toString()}, Requested: ${amount.toString()}`,
        );
      }

      // Deduct from balance, add to pending
      const updatedWallet = await tx.wallet.update({
        where: { userId: params.userId },
        data: {
          balance: { decrement: amount },
          pendingBalance: { increment: amount },
        },
      });

      // Create payout request
      const payout = await tx.payoutRequest.create({
        data: {
          userId: params.userId,
          amount,
          status: PayoutStatus.PENDING,
          bankDetails: params.bankDetails,
        },
      });

      // Create withdrawal transaction log
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: WalletTransactionType.WITHDRAWAL_REQUEST,
          referenceId: payout.id,
          description: `Payout request #${payout.id.substring(0, 8)}`,
        },
      });

      return { wallet: updatedWallet, payout };
    });
  }

  // ─── Payout: Approve ──────────────────────────────────────────────────

  /**
   * ATOMIC: Approve payout — clear pendingBalance permanently.
   * Only processes PENDING payouts. Prevents double-approve.
   */
  async approvePayoutAtomic(payoutId: string) {
    return this.prisma.$transaction(async (tx) => {
      const payout = await tx.payoutRequest.findUnique({
        where: { id: payoutId },
      });

      if (!payout) throw new Error('Payout not found');
      if (payout.status !== PayoutStatus.PENDING) {
        throw new Error(
          `Payout is ${payout.status}, only PENDING can be approved`,
        );
      }

      const payoutAmount = toDecimal(payout.amount);

      // Update status atomically
      const updatedPayout = await tx.payoutRequest.update({
        where: { id: payoutId },
        data: { status: PayoutStatus.APPROVED },
      });

      // Decrement pending balance
      await tx.wallet.update({
        where: { userId: payout.userId },
        data: {
          pendingBalance: { decrement: payoutAmount },
        },
      });

      // Create WITHDRAWAL_APPROVED transaction
      const wallet = await tx.wallet.findUnique({
        where: { userId: payout.userId },
      });
      if (wallet) {
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount: payoutAmount,
            type: WalletTransactionType.WITHDRAWAL_APPROVED,
            referenceId: payoutId,
            description: `Payout approved #${payoutId.substring(0, 8)}`,
          },
        });
      }

      return updatedPayout;
    });
  }

  // ─── Payout: Reject ───────────────────────────────────────────────────

  /**
   * ATOMIC: Reject payout — return pending to available balance.
   * Only processes PENDING payouts. Prevents double-reject.
   */
  async rejectPayoutAtomic(payoutId: string, adminNote?: string) {
    return this.prisma.$transaction(async (tx) => {
      const payout = await tx.payoutRequest.findUnique({
        where: { id: payoutId },
      });

      if (!payout) throw new Error('Payout not found');
      if (payout.status !== PayoutStatus.PENDING) {
        throw new Error(
          `Payout is ${payout.status}, only PENDING can be rejected`,
        );
      }

      const payoutAmount = toDecimal(payout.amount);

      // Update status with admin note
      const updatedPayout = await tx.payoutRequest.update({
        where: { id: payoutId },
        data: { status: PayoutStatus.REJECTED, adminNote },
      });

      // Refund: pendingBalance → balance
      await tx.wallet.update({
        where: { userId: payout.userId },
        data: {
          pendingBalance: { decrement: payoutAmount },
          balance: { increment: payoutAmount },
        },
      });

      // Create WITHDRAWAL_REJECTED transaction
      const wallet = await tx.wallet.findUnique({
        where: { userId: payout.userId },
      });
      if (wallet) {
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount: payoutAmount,
            type: WalletTransactionType.WITHDRAWAL_REJECTED,
            referenceId: payoutId,
            description: `Payout rejected #${payoutId.substring(0, 8)}${adminNote ? ` — ${adminNote}` : ''}`,
          },
        });
      }

      return updatedPayout;
    });
  }
}
