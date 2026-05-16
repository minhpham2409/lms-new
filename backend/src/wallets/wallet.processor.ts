import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { WalletRepository } from '../database/repositories';
import { JobNames, QueueNames } from '../shared/queues';
import { SystemConfigRepository } from '../database/repositories';

const DEFAULT_PLATFORM_FEE = 20;

export interface RevenueSplitJobData {
  orderId: string;
}

@Processor(QueueNames.WALLET)
export class WalletProcessor {
  private readonly logger = new Logger(WalletProcessor.name);

  constructor(
    private readonly walletRepository: WalletRepository,
    private readonly systemConfigRepository: SystemConfigRepository,
  ) {}

  @Process(JobNames.SPLIT_ORDER_REVENUE)
  async splitOrderRevenue(job: Job<RevenueSplitJobData>) {
    const config = await this.systemConfigRepository.getByKey('platformFeePercentage');
    const feePercentage = config ? Number(config.value) || DEFAULT_PLATFORM_FEE : DEFAULT_PLATFORM_FEE;

    this.logger.log(`[Revenue Split Queue] Processing order ${job.data.orderId}`);
    const result = await this.walletRepository.splitOrderRevenueAtomic({
      orderId: job.data.orderId,
      feePercent: feePercentage,
    });

    this.logger.log(
      `[Revenue Split Queue] Order ${result.orderId}: credited=${result.credited}, skipped=${result.skippedDuplicate}, total=${result.totalTeacherEarning}`,
    );

    return result;
  }
}
