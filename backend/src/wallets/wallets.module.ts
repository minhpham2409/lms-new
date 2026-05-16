import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';
import { WalletProcessor } from './wallet.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { QueueNames } from '../shared/queues';
import {
  WalletRepository,
  SystemConfigRepository,
} from '../database/repositories';

@Module({
  imports: [PrismaModule, AuthModule, BullModule.registerQueue({ name: QueueNames.WALLET })],
  controllers: [WalletsController],
  providers: [
    WalletsService,
    WalletProcessor,
    WalletRepository,
    SystemConfigRepository,
  ],
  exports: [WalletsService],
})
export class WalletsModule {}
