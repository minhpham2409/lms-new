import { Controller, Get, Post, Param, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AchievementsService } from './achievements.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Achievements')
@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my achievements and badges' })
  async getMyAchievements(@Request() req) {
    // Check and award any new badges first
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

  @Post('seed')
  @ApiOperation({ summary: 'Seed badge definitions' })
  async seedBadges() {
    await this.achievementsService.seedBadges();
    return { message: 'Badges seeded successfully' };
  }
}
