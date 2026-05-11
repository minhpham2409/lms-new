import { Controller, Get, Put, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/dashboard')
  getDashboardData(@Request() req) {
    return this.usersService.getStudentDashboard(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/streak/check-in')
  checkInStreak(@Request() req) {
    return this.usersService.checkInStreak(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/streak-coupon')
  getMyStreakCoupon(@Request() req) {
    return this.usersService.getMyStreakCoupon(req.user.id);
  }

  @Get('public/teachers')
  getPublicTeachers() {
    return this.usersService.findPublicTeachers();
  }

  @Get('public/teachers/:id')
  getPublicTeacherById(@Param('id') id: string) {
    return this.usersService.findPublicTeacherById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() updateUserDto: any) {
    return this.usersService.update(id, updateUserDto);
  }
}
