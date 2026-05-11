import { Controller, Get, Post, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { MonthlyRaceService } from './monthly-race.service';

@ApiTags('Monthly Race')
@Controller('monthly-race')
export class MonthlyRaceController {
  constructor(private readonly monthlyRaceService: MonthlyRaceService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('leaderboard')
  @ApiOperation({ summary: 'Get monthly leaderboard' })
  async getLeaderboard(
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const now = new Date();
    const m = month ? parseInt(month) : now.getMonth() + 1;
    const y = year ? parseInt(year) : now.getFullYear();
    return this.monthlyRaceService.getMonthlyLeaderboard(m, y);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('my-stats')
  @ApiOperation({ summary: 'Get my monthly stats' })
  async getMyStats(
    @Request() req,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const now = new Date();
    const m = month ? parseInt(month) : now.getMonth() + 1;
    const y = year ? parseInt(year) : now.getFullYear();
    return this.monthlyRaceService.getUserMonthlyStats(req.user.id, m, y);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('history')
  @ApiOperation({ summary: 'Get historical monthly winners' })
  async getHistory() {
    return this.monthlyRaceService.getHistory();
  }

  @Get('xp-config')
  @ApiOperation({ summary: 'Get XP point values' })
  getXPConfig() {
    return this.monthlyRaceService.getXPConfig();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('finalize')
  @ApiOperation({ summary: 'Finalize a month (admin)' })
  async finalizeMonth(
    @Request() req,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    // Only admin can finalize
    if (req.user.role !== 'admin') {
      return { message: 'Chỉ admin mới có quyền tổng kết tháng.' };
    }
    const now = new Date();
    // Default to previous month
    let m = month ? parseInt(month) : now.getMonth(); // getMonth() is 0-indexed, so this gives prev month
    let y = year ? parseInt(year) : now.getFullYear();
    if (m < 1) { m = 12; y--; }
    return this.monthlyRaceService.finalizeMonth(m, y);
  }
}
