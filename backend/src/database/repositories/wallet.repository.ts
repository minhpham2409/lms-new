import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseRepository } from './base.repository';
import { Wallet } from '@prisma/client';

@Injectable()
export class WalletRepository extends BaseRepository<Wallet> {
  private readonly logger = new Logger(WalletRepository.name);

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  get model() {
    return this.prisma.wallet;
  }

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
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        },
      },
    });
    return wallet;
  }

  /**
   * ATOMIC: Add earning to wallet + create transaction log.
   * Uses Prisma Interactive Transaction to guarantee consistency.
   */
  async addEarning(params: {
    userId: string;
    amount: number;
    referenceId: string;
    description: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // Upsert wallet (create if first earning)
      const wallet = await tx.wallet.upsert({
        where: { userId: params.userId },
        create: {
          userId: params.userId,
          balance: params.amount,
          totalEarned: params.amount,
          pendingBalance: 0,
        },
        update: {
          balance: { increment: params.amount },
          totalEarned: { increment: params.amount },
        },
      });

      // Create transaction log
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: params.amount,
          type: 'EARNING',
          referenceId: params.referenceId,
          description: params.description,
        },
      });

      this.logger.log(
        `[Earning] +${params.amount} → Wallet ${wallet.id} (ref: ${params.referenceId})`,
      );

      return { wallet, transaction };
    });
  }

  /**
   * ATOMIC: Request payout — deduct balance, add to pendingBalance.
   */
  async requestPayout(params: {
    userId: string;
    amount: number;
    bankDetails: any;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId: params.userId },
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      if (Number(wallet.balance) < params.amount) {
        throw new Error('Insufficient balance');
      }

      // Deduct from balance, add to pending
      const updatedWallet = await tx.wallet.update({
        where: { userId: params.userId },
        data: {
          balance: { decrement: params.amount },
          pendingBalance: { increment: params.amount },
        },
      });

      // Create payout request
      const payout = await tx.payoutRequest.create({
        data: {
          userId: params.userId,
          amount: params.amount,
          status: 'PENDING',
          bankDetails: params.bankDetails,
        },
      });

      // Create withdrawal transaction log
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: params.amount,
          type: 'WITHDRAWAL',
          referenceId: payout.id,
          description: `Payout request #${payout.id.substring(0, 8)}`,
        },
      });

      return { wallet: updatedWallet, payout };
    });
  }

  /**
   * ATOMIC: Approve payout — clear pendingBalance permanently.
   */
  async approvePayout(payoutId: string) {
    return this.prisma.$transaction(async (tx) => {
      const payout = await tx.payoutRequest.findUnique({
        where: { id: payoutId },
      });
      if (!payout) throw new Error('Payout not found');
      if (payout.status !== 'PENDING') throw new Error('Payout is not pending');

      await tx.payoutRequest.update({
        where: { id: payoutId },
        data: { status: 'APPROVED' },
      });

      await tx.wallet.update({
        where: { userId: payout.userId },
        data: {
          pendingBalance: { decrement: Number(payout.amount) },
        },
      });

      return payout;
    });
  }

  /**
   * ATOMIC: Reject payout — return pending to available balance.
   */
  async rejectPayout(payoutId: string, adminNote?: string) {
    return this.prisma.$transaction(async (tx) => {
      const payout = await tx.payoutRequest.findUnique({
        where: { id: payoutId },
      });
      if (!payout) throw new Error('Payout not found');
      if (payout.status !== 'PENDING') throw new Error('Payout is not pending');

      await tx.payoutRequest.update({
        where: { id: payoutId },
        data: { status: 'REJECTED', adminNote },
      });

      // Refund: pendingBalance → balance
      await tx.wallet.update({
        where: { userId: payout.userId },
        data: {
          pendingBalance: { decrement: Number(payout.amount) },
          balance: { increment: Number(payout.amount) },
        },
      });

      return payout;
    });
  }
}
