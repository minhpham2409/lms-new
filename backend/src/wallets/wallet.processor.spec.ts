import { WalletProcessor } from './wallet.processor';
import { WalletRepository, SystemConfigRepository } from '../database/repositories';

describe('WalletProcessor', () => {
  it('splits order revenue using configured platform fee', async () => {
    const walletRepository = {
      splitOrderRevenueAtomic: jest.fn().mockResolvedValue({
        orderId: 'order-1',
        credited: 1,
        skippedDuplicate: 0,
        totalTeacherEarning: '80',
      }),
    };
    const systemConfigRepository = {
      getByKey: jest.fn().mockResolvedValue({ value: 20 }),
    };
    const processor = new WalletProcessor(
      walletRepository as unknown as WalletRepository,
      systemConfigRepository as unknown as SystemConfigRepository,
    );

    const result = await processor.splitOrderRevenue({
      data: { orderId: 'order-1' },
    } as any);

    expect(result).toEqual({
      orderId: 'order-1',
      credited: 1,
      skippedDuplicate: 0,
      totalTeacherEarning: '80',
    });
    expect(walletRepository.splitOrderRevenueAtomic).toHaveBeenCalledWith({
      orderId: 'order-1',
      feePercent: 20,
    });
  });

  it('propagates errors so Bull can retry the job', async () => {
    const walletRepository = {
      splitOrderRevenueAtomic: jest.fn().mockRejectedValue(new Error('db down')),
    };
    const systemConfigRepository = {
      getByKey: jest.fn().mockResolvedValue(null),
    };
    const processor = new WalletProcessor(
      walletRepository as unknown as WalletRepository,
      systemConfigRepository as unknown as SystemConfigRepository,
    );

    await expect(
      processor.splitOrderRevenue({ data: { orderId: 'order-1' } } as any),
    ).rejects.toThrow('db down');
  });
});
