import { Module } from '@nestjs/common';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import {
  WalletRepository,
  SystemConfigRepository,
  OrderRepository,
  CourseRepository,
} from '../database/repositories';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [WalletsController],
  providers: [
    WalletsService,
    WalletRepository,
    SystemConfigRepository,
    OrderRepository,
    CourseRepository,
  ],
  exports: [WalletsService],
})
export class WalletsModule {}
