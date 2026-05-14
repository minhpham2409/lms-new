import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';

@Controller('wallets')
@UseGuards(JwtAuthGuard)
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  // ─── Teacher endpoints ───────────────────────────────────────────────

  /** Get current teacher's wallet with recent transactions */
  @Get('me')
  @UseGuards(RolesGuard)
  @Roles('teacher')
  getMyWallet(@GetUser() user: any) {
    return this.walletsService.getMyWallet(user.id);
  }

  /** Update bank info for payouts */
  @Put('bank-info')
  @UseGuards(RolesGuard)
  @Roles('teacher')
  updateBankInfo(
    @GetUser() user: any,
    @Body() body: { bankName: string; bankAccount: string; bankOwner: string },
  ) {
    return this.walletsService.updateBankInfo(user.id, body);
  }

  /** Request a payout */
  @Post('payouts')
  @UseGuards(RolesGuard)
  @Roles('teacher')
  requestPayout(@GetUser() user: any, @Body() body: { amount: number }) {
    return this.walletsService.requestPayout(user.id, body.amount);
  }

  // ─── Admin endpoints ────────────────────────────────────────────────

  /** Get all payout requests (paginated) */
  @Get('admin/payouts')
  @UseGuards(RolesGuard)
  @Roles('admin')
  getAllPayouts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.walletsService.getAllPayouts({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      status,
    });
  }

  /** Approve a payout request */
  @Patch('admin/payouts/:id/approve')
  @UseGuards(RolesGuard)
  @Roles('admin')
  approvePayout(@Param('id') id: string) {
    return this.walletsService.approvePayout(id);
  }

  /** Reject a payout request */
  @Patch('admin/payouts/:id/reject')
  @UseGuards(RolesGuard)
  @Roles('admin')
  rejectPayout(
    @Param('id') id: string,
    @Body() body: { adminNote?: string },
  ) {
    return this.walletsService.rejectPayout(id, body.adminNote);
  }

  /** Get current platform fee */
  @Get('admin/configs/fee')
  @UseGuards(RolesGuard)
  @Roles('admin')
  getPlatformFee() {
    return this.walletsService.getPlatformFeePercentage();
  }

  /** Update platform fee percentage */
  @Put('admin/configs/fee')
  @UseGuards(RolesGuard)
  @Roles('admin')
  updatePlatformFee(@Body() body: { percentage: number }) {
    return this.walletsService.updatePlatformFee(body.percentage);
  }
}
