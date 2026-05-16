import { WalletRepository, RevenueSplitResult } from '../database/repositories/wallet.repository';
import { PrismaService } from '../prisma/prisma.service';
import { WalletTransactionType, PayoutStatus, Prisma } from '@prisma/client';

/**
 * Comprehensive unit tests for Wallet/Payout flows.
 *
 * Tests cover:
 * 1. Idempotent revenue split (duplicate event detection)
 * 2. Atomic revenue split (rollback on failure)
 * 3. Payout request (sufficient/insufficient balance)
 * 4. Approve/reject payout (state transitions, double-process guard)
 * 5. Decimal money handling (no float)
 */
describe('WalletRepository', () => {
  let repo: WalletRepository;

  // ─── Transaction mock helpers ────────────────────────────────────────

  const createMockTx = () => ({
    order: {
      findUnique: jest.fn(),
    },
    wallet: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    walletTransaction: {
      create: jest.fn(),
    },
    payoutRequest: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  });

  const createPrismaService = (mockTx: ReturnType<typeof createMockTx>) =>
    ({
      $transaction: jest.fn().mockImplementation((fn) => fn(mockTx)),
      wallet: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      payoutRequest: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
    }) as unknown as PrismaService;

  // ─── Revenue Split Tests ────────────────────────────────────────────

  describe('splitOrderRevenueAtomic', () => {
    it('should credit teacher earnings for a paid order', async () => {
      const mockTx = createMockTx();
      const prismaService = createPrismaService(mockTx);
      repo = new WalletRepository(prismaService);

      mockTx.order.findUnique.mockResolvedValue({
        id: 'order-1',
        status: 'paid',
        totalPrice: new Prisma.Decimal('100.00'),
        finalPrice: new Prisma.Decimal('100.00'),
        items: [
          {
            id: 'item-1',
            price: new Prisma.Decimal('100.00'),
            course: {
              id: 'course-1',
              title: 'Test Course',
              authorId: 'teacher-1',
              price: new Prisma.Decimal('100.00'),
            },
          },
        ],
      });

      mockTx.wallet.upsert.mockResolvedValue({
        id: 'wallet-1',
        userId: 'teacher-1',
        balance: new Prisma.Decimal('80.00'),
        totalEarned: new Prisma.Decimal('80.00'),
        pendingBalance: new Prisma.Decimal('0'),
      });

      mockTx.walletTransaction.create.mockResolvedValue({ id: 'txn-1' });

      const result = await repo.splitOrderRevenueAtomic({
        orderId: 'order-1',
        feePercent: '20',
      });

      expect(result.credited).toBe(1);
      expect(result.skippedDuplicate).toBe(0);
      expect(result.totalTeacherEarning).toBe('80');
      expect(result.orderId).toBe('order-1');

      // Verify wallet upsert was called
      expect(mockTx.wallet.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'teacher-1' },
        }),
      );

      // Verify transaction was created with idempotencyKey
      expect(mockTx.walletTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: WalletTransactionType.EARNING,
          idempotencyKey: 'revenue:order-1:course-1:teacher-1',
        }),
      });
    });

    it('should skip duplicate earnings (idempotency via P2002)', async () => {
      const mockTx = createMockTx();
      const prismaService = createPrismaService(mockTx);
      repo = new WalletRepository(prismaService);

      mockTx.order.findUnique.mockResolvedValue({
        id: 'order-1',
        status: 'paid',
        totalPrice: new Prisma.Decimal('100.00'),
        finalPrice: new Prisma.Decimal('100.00'),
        items: [
          {
            id: 'item-1',
            price: new Prisma.Decimal('100.00'),
            course: {
              id: 'course-1',
              title: 'Test Course',
              authorId: 'teacher-1',
              price: new Prisma.Decimal('100.00'),
            },
          },
        ],
      });

      mockTx.wallet.upsert.mockResolvedValue({
        id: 'wallet-1',
        userId: 'teacher-1',
        balance: new Prisma.Decimal('80.00'),
      });

      // Simulate unique constraint violation (duplicate idempotencyKey)
      const uniqueError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint violation',
        { code: 'P2002', clientVersion: '6.5.0' },
      );
      mockTx.walletTransaction.create.mockRejectedValue(uniqueError);
      mockTx.wallet.update.mockResolvedValue({}); // for balance revert

      const result = await repo.splitOrderRevenueAtomic({
        orderId: 'order-1',
        feePercent: '20',
      });

      expect(result.credited).toBe(0);
      expect(result.skippedDuplicate).toBe(1);
      // Duplicate events reserve the idempotency key before balance mutation,
      // so no compensating debit should be needed.
      expect(mockTx.wallet.update).not.toHaveBeenCalled();
    });

    it('should throw and rollback on non-duplicate error', async () => {
      const mockTx = createMockTx();
      const prismaService = createPrismaService(mockTx);
      repo = new WalletRepository(prismaService);

      mockTx.order.findUnique.mockResolvedValue({
        id: 'order-1',
        status: 'paid',
        totalPrice: new Prisma.Decimal('100.00'),
        finalPrice: new Prisma.Decimal('100.00'),
        items: [
          {
            id: 'item-1',
            price: new Prisma.Decimal('100.00'),
            course: {
              id: 'course-1',
              title: 'Test Course',
              authorId: 'teacher-1',
              price: new Prisma.Decimal('100.00'),
            },
          },
        ],
      });

      mockTx.wallet.upsert.mockResolvedValue({
        id: 'wallet-1',
        userId: 'teacher-1',
      });

      // Simulate a database connection error (NOT a duplicate)
      mockTx.walletTransaction.create.mockRejectedValue(
        new Error('Connection lost'),
      );

      // The $transaction mock should propagate the throw
      await expect(
        repo.splitOrderRevenueAtomic({
          orderId: 'order-1',
          feePercent: '20',
        }),
      ).rejects.toThrow('Connection lost');
    });

    it('should reject unpaid orders', async () => {
      const mockTx = createMockTx();
      const prismaService = createPrismaService(mockTx);
      repo = new WalletRepository(prismaService);

      mockTx.order.findUnique.mockResolvedValue({
        id: 'order-1',
        status: 'pending',
        items: [],
      });

      await expect(
        repo.splitOrderRevenueAtomic({
          orderId: 'order-1',
          feePercent: '20',
        }),
      ).rejects.toThrow('not paid');
    });

    it('should handle multiple items in one atomic transaction', async () => {
      const mockTx = createMockTx();
      const prismaService = createPrismaService(mockTx);
      repo = new WalletRepository(prismaService);

      mockTx.order.findUnique.mockResolvedValue({
        id: 'order-1',
        status: 'paid',
        totalPrice: new Prisma.Decimal('300.00'),
        finalPrice: new Prisma.Decimal('300.00'),
        items: [
          {
            id: 'item-1',
            price: new Prisma.Decimal('100.00'),
            course: {
              id: 'course-1',
              title: 'Course A',
              authorId: 'teacher-1',
              price: new Prisma.Decimal('100.00'),
            },
          },
          {
            id: 'item-2',
            price: new Prisma.Decimal('200.00'),
            course: {
              id: 'course-2',
              title: 'Course B',
              authorId: 'teacher-2',
              price: new Prisma.Decimal('200.00'),
            },
          },
        ],
      });

      mockTx.wallet.upsert.mockResolvedValue({ id: 'wallet-1' });
      mockTx.walletTransaction.create.mockResolvedValue({ id: 'txn-1' });

      const result = await repo.splitOrderRevenueAtomic({
        orderId: 'order-1',
        feePercent: '20',
      });

      expect(result.credited).toBe(2);
      expect(result.skippedDuplicate).toBe(0);
      // 80 + 160 = 240
      expect(result.totalTeacherEarning).toBe('240');

      // Both teachers should get wallet upsert
      expect(mockTx.wallet.upsert).toHaveBeenCalledTimes(2);
    });
  });

  // ─── Payout Request Tests ─────────────────────────────────────────

  describe('requestPayoutAtomic', () => {
    it('should create payout and deduct balance when sufficient', async () => {
      const mockTx = createMockTx();
      const prismaService = createPrismaService(mockTx);
      repo = new WalletRepository(prismaService);

      mockTx.wallet.findUnique.mockResolvedValue({
        id: 'wallet-1',
        userId: 'teacher-1',
        balance: new Prisma.Decimal('500.00'),
        pendingBalance: new Prisma.Decimal('0'),
      });

      const updatedWallet = {
        id: 'wallet-1',
        balance: new Prisma.Decimal('400.00'),
        pendingBalance: new Prisma.Decimal('100.00'),
      };
      mockTx.wallet.update.mockResolvedValue(updatedWallet);

      const mockPayout = {
        id: 'payout-1',
        userId: 'teacher-1',
        amount: new Prisma.Decimal('100.00'),
        status: PayoutStatus.PENDING,
      };
      mockTx.payoutRequest.create.mockResolvedValue(mockPayout);
      mockTx.walletTransaction.create.mockResolvedValue({});

      const result = await repo.requestPayoutAtomic({
        userId: 'teacher-1',
        amount: '100.00',
        bankDetails: {
          bankName: 'Vietcombank',
          bankAccount: '123456',
          bankOwner: 'Test User',
        },
      });

      expect(result.payout.status).toBe(PayoutStatus.PENDING);

      // Verify transaction type
      expect(mockTx.walletTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: WalletTransactionType.WITHDRAWAL_REQUEST,
          referenceId: 'payout-1',
        }),
      });
    });

    it('should reject when balance is insufficient', async () => {
      const mockTx = createMockTx();
      const prismaService = createPrismaService(mockTx);
      repo = new WalletRepository(prismaService);

      mockTx.wallet.findUnique.mockResolvedValue({
        id: 'wallet-1',
        userId: 'teacher-1',
        balance: new Prisma.Decimal('50.00'),
      });

      await expect(
        repo.requestPayoutAtomic({
          userId: 'teacher-1',
          amount: '100.00',
          bankDetails: {
            bankName: 'VCB',
            bankAccount: '123',
            bankOwner: 'Test',
          },
        }),
      ).rejects.toThrow('Insufficient balance');

      // Wallet should NOT be updated
      expect(mockTx.wallet.update).not.toHaveBeenCalled();
      expect(mockTx.payoutRequest.create).not.toHaveBeenCalled();
    });

    it('should reject when wallet does not exist', async () => {
      const mockTx = createMockTx();
      const prismaService = createPrismaService(mockTx);
      repo = new WalletRepository(prismaService);

      mockTx.wallet.findUnique.mockResolvedValue(null);

      await expect(
        repo.requestPayoutAtomic({
          userId: 'unknown',
          amount: '100.00',
          bankDetails: {
            bankName: 'VCB',
            bankAccount: '123',
            bankOwner: 'Test',
          },
        }),
      ).rejects.toThrow('Wallet not found');
    });
  });

  // ─── Approve Payout Tests ─────────────────────────────────────────

  describe('approvePayoutAtomic', () => {
    it('should approve a PENDING payout', async () => {
      const mockTx = createMockTx();
      const prismaService = createPrismaService(mockTx);
      repo = new WalletRepository(prismaService);

      mockTx.payoutRequest.findUnique.mockResolvedValue({
        id: 'payout-1',
        userId: 'teacher-1',
        amount: new Prisma.Decimal('100.00'),
        status: PayoutStatus.PENDING,
      });

      const approvedPayout = {
        id: 'payout-1',
        status: PayoutStatus.APPROVED,
        amount: new Prisma.Decimal('100.00'),
      };
      mockTx.payoutRequest.update.mockResolvedValue(approvedPayout);
      mockTx.wallet.update.mockResolvedValue({});

      // For creating WITHDRAWAL_APPROVED transaction
      mockTx.wallet.findUnique.mockResolvedValue({
        id: 'wallet-1',
        userId: 'teacher-1',
      });
      mockTx.walletTransaction.create.mockResolvedValue({});

      const result = await repo.approvePayoutAtomic('payout-1', { adminId: 'admin-1' });

      expect(result.status).toBe(PayoutStatus.APPROVED);

      // Verify pendingBalance was decremented
      expect(mockTx.wallet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            pendingBalance: expect.objectContaining({
              decrement: expect.any(Prisma.Decimal),
            }),
          }),
        }),
      );

      // Verify WITHDRAWAL_APPROVED transaction was created
      expect(mockTx.walletTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: WalletTransactionType.WITHDRAWAL_APPROVED,
        }),
      });
    });

    it('should NOT approve an already APPROVED payout (double-approve guard)', async () => {
      const mockTx = createMockTx();
      const prismaService = createPrismaService(mockTx);
      repo = new WalletRepository(prismaService);

      mockTx.payoutRequest.findUnique.mockResolvedValue({
        id: 'payout-1',
        status: PayoutStatus.APPROVED,
        amount: new Prisma.Decimal('100.00'),
      });

      await expect(repo.approvePayoutAtomic('payout-1', { adminId: 'admin-1' })).rejects.toThrow(
        'only PENDING can be approved',
      );
    });

    it('should NOT approve a REJECTED payout', async () => {
      const mockTx = createMockTx();
      const prismaService = createPrismaService(mockTx);
      repo = new WalletRepository(prismaService);

      mockTx.payoutRequest.findUnique.mockResolvedValue({
        id: 'payout-1',
        status: PayoutStatus.REJECTED,
        amount: new Prisma.Decimal('100.00'),
      });

      await expect(repo.approvePayoutAtomic('payout-1', { adminId: 'admin-1' })).rejects.toThrow(
        'only PENDING can be approved',
      );
    });
  });

  // ─── Reject Payout Tests ──────────────────────────────────────────

  describe('rejectPayoutAtomic', () => {
    it('should reject a PENDING payout and refund balance', async () => {
      const mockTx = createMockTx();
      const prismaService = createPrismaService(mockTx);
      repo = new WalletRepository(prismaService);

      mockTx.payoutRequest.findUnique.mockResolvedValue({
        id: 'payout-1',
        userId: 'teacher-1',
        amount: new Prisma.Decimal('100.00'),
        status: PayoutStatus.PENDING,
      });

      const rejectedPayout = {
        id: 'payout-1',
        status: PayoutStatus.REJECTED,
        amount: new Prisma.Decimal('100.00'),
        adminNote: 'Invalid bank info',
      };
      mockTx.payoutRequest.update.mockResolvedValue(rejectedPayout);
      mockTx.wallet.update.mockResolvedValue({});

      mockTx.wallet.findUnique.mockResolvedValue({
        id: 'wallet-1',
        userId: 'teacher-1',
      });
      mockTx.walletTransaction.create.mockResolvedValue({});

      const result = await repo.rejectPayoutAtomic(
        'payout-1',
        { adminId: 'admin-1', adminNote: 'Invalid bank info' },
      );

      expect(result.status).toBe(PayoutStatus.REJECTED);

      // Verify balance was refunded (pendingBalance decrement + balance increment)
      expect(mockTx.wallet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            pendingBalance: expect.objectContaining({
              decrement: expect.any(Prisma.Decimal),
            }),
            balance: expect.objectContaining({
              increment: expect.any(Prisma.Decimal),
            }),
          }),
        }),
      );

      // Verify WITHDRAWAL_REJECTED transaction
      expect(mockTx.walletTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: WalletTransactionType.WITHDRAWAL_REJECTED,
        }),
      });
    });

    it('should NOT reject an already REJECTED payout (double-reject guard)', async () => {
      const mockTx = createMockTx();
      const prismaService = createPrismaService(mockTx);
      repo = new WalletRepository(prismaService);

      mockTx.payoutRequest.findUnique.mockResolvedValue({
        id: 'payout-1',
        status: PayoutStatus.REJECTED,
        amount: new Prisma.Decimal('100.00'),
      });

      await expect(
        repo.rejectPayoutAtomic('payout-1', { adminId: 'admin-1', adminNote: 'note' }),
      ).rejects.toThrow('only PENDING can be rejected');
    });

    it('should NOT reject an APPROVED payout', async () => {
      const mockTx = createMockTx();
      const prismaService = createPrismaService(mockTx);
      repo = new WalletRepository(prismaService);

      mockTx.payoutRequest.findUnique.mockResolvedValue({
        id: 'payout-1',
        status: PayoutStatus.APPROVED,
        amount: new Prisma.Decimal('100.00'),
      });

      await expect(
        repo.rejectPayoutAtomic('payout-1', { adminId: 'admin-1' }),
      ).rejects.toThrow('only PENDING can be rejected');
    });
  });
});

// ─── WalletsService Tests ──────────────────────────────────────────

describe('WalletsService', () => {
  // Lazy import to avoid circular dep issues in test setup
  let WalletsServiceClass: typeof import('./wallets.service').WalletsService;

  beforeAll(async () => {
    const mod = await import('./wallets.service');
    WalletsServiceClass = mod.WalletsService;
  });

  describe('onPaymentCompleted — idempotency', () => {
    it('should call splitOrderRevenueAtomic and log results', async () => {
      const mockWalletRepo = {
        splitOrderRevenueAtomic: jest.fn().mockResolvedValue({
          orderId: 'order-1',
          credited: 2,
          skippedDuplicate: 0,
          totalTeacherEarning: '160',
        } as RevenueSplitResult),
      };

      const mockConfigRepo = {
        getByKey: jest.fn().mockResolvedValue({ value: 20 }),
      };

      const service = new WalletsServiceClass(
        mockWalletRepo as any,
        mockConfigRepo as any,
      );

      await service.onPaymentCompleted({
        orderId: 'order-1',
        paymentId: 'payment-1',
        userId: 'user-1',
        amount: 200,
        courseIds: ['c1', 'c2'],
        courseTitles: ['A', 'B'],
      });

      expect(mockWalletRepo.splitOrderRevenueAtomic).toHaveBeenCalledWith({
        orderId: 'order-1',
        feePercent: 20,
      });
    });

    it('should handle duplicate event gracefully (skippedDuplicate > 0)', async () => {
      const mockWalletRepo = {
        splitOrderRevenueAtomic: jest.fn().mockResolvedValue({
          orderId: 'order-1',
          credited: 0,
          skippedDuplicate: 2,
          totalTeacherEarning: '0',
        } as RevenueSplitResult),
      };

      const mockConfigRepo = {
        getByKey: jest.fn().mockResolvedValue(null), // use default fee
      };

      const service = new WalletsServiceClass(
        mockWalletRepo as any,
        mockConfigRepo as any,
      );

      // Should NOT throw
      await expect(
        service.onPaymentCompleted({
          orderId: 'order-1',
          paymentId: 'payment-1',
          userId: 'user-1',
          amount: 200,
          courseIds: ['c1'],
          courseTitles: ['A'],
        }),
      ).resolves.not.toThrow();
    });
  });

  describe('requestPayout — validation', () => {
    it('should reject amount <= 0', async () => {
      const mockWalletRepo = {
        getUserBankInfo: jest.fn(),
        requestPayoutAtomic: jest.fn(),
      };
      const mockConfigRepo = {} as any;

      const service = new WalletsServiceClass(
        mockWalletRepo as any,
        mockConfigRepo,
      );

      await expect(service.requestPayout('user-1', 0)).rejects.toThrow(
        'Amount must be greater than 0',
      );
      await expect(service.requestPayout('user-1', -10)).rejects.toThrow(
        'Amount must be greater than 0',
      );
    });

    it('should reject when bank info is missing', async () => {
      const mockWalletRepo = {
        getUserBankInfo: jest.fn().mockResolvedValue({
          id: 'user-1',
          bankName: null,
          bankAccount: null,
          bankOwner: null,
        }),
      };
      const mockConfigRepo = {} as any;

      const service = new WalletsServiceClass(
        mockWalletRepo as any,
        mockConfigRepo,
      );

      await expect(service.requestPayout('user-1', 100)).rejects.toThrow(
        'bank information',
      );
    });
  });
});
