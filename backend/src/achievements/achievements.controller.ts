import { Controller, Get, Post, Param, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AchievementsService } from './achievements.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Achievements')
@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my achievements and badges' })
  async getMyAchievements(@Request() req: { user: { id: string } }) {
    await this.achievementsService.checkAndAwardBadges(req.user.id);
    return this.achievementsService.getUserAchievements(req.user.id);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get badge leaderboard' })
  async getLeaderboard() {
    return this.achievementsService.getLeaderboard();
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get public profile badges of a user' })
  async getUserProfile(@Param('userId') userId: string) {
    const profile = await this.achievementsService.getUserPublicProfile(userId);
    if (!profile) throw new NotFoundException('User not found');
    return profile;
  }

  /**
   * POST /achievements/seed — admin only.
   * Disabled in production unless explicitly enabled via ENABLE_SEED=true.
   */
  @Post('seed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Seed badge definitions (admin only)' })
  async seedBadges() {
    if (process.env.NODE_ENV === 'production' && process.env.ENABLE_SEED !== 'true') {
      return { message: 'Seed disabled in production. Set ENABLE_SEED=true to override.' };
    }
    await this.achievementsService.seedBadges();
    return { message: 'Badges seeded successfully' };
  }
}
