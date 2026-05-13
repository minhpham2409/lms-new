import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  /** GET /users/profile — own profile from JWT */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: { user: { id: string } }) {
    return req.user;
  }

  /** GET /users/me/dashboard — own student dashboard */
  @UseGuards(JwtAuthGuard)
  @Get('me/dashboard')
  getDashboardData(@Request() req: { user: { id: string } }) {
    return this.usersService.getStudentDashboard(req.user.id);
  }

  /** POST /users/me/streak/check-in */
  @UseGuards(JwtAuthGuard)
  @Put('me/streak/check-in')
  checkInStreak(@Request() req: { user: { id: string } }) {
    return this.usersService.checkInStreak(req.user.id);
  }

  /** GET /users/me/streak-coupon */
  @UseGuards(JwtAuthGuard)
  @Get('me/streak-coupon')
  getMyStreakCoupon(@Request() req: { user: { id: string } }) {
    return this.usersService.getMyStreakCoupon(req.user.id);
  }

  /** GET /users/public/teachers — truly public list of teachers */
  @Get('public/teachers')
  getPublicTeachers() {
    return this.usersService.findPublicTeachers();
  }

  /** GET /users/public/teachers/:id */
  @Get('public/teachers/:id')
  getPublicTeacherById(@Param('id') id: string) {
    return this.usersService.findPublicTeacherById(id);
  }

  /**
   * PUT /users/me — self-update of safe fields only.
   * Does NOT allow changing role, isActive, or password (use /auth/change-password).
   */
  @UseGuards(JwtAuthGuard)
  @Put('me')
  updateMe(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  /**
   * GET /users — admin only.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  /**
   * GET /users/:id — admin only OR self.
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Request() req: { user: { id: string; role: string } },
  ) {
    if (req.user.role !== 'admin' && req.user.id !== id) {
      throw new ForbiddenException('Access denied');
    }
    return this.usersService.findOne(id);
  }
}
