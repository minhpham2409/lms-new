import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { CreateCourseDto } from '../courses/dto/create-course.dto';
import { UpdateCourseDto } from '../courses/dto/update-course.dto';
import { CreateLessonDto } from '../lessons/dto/create-lesson.dto';
import { UpdateLessonDto } from '../lessons/dto/update-lesson.dto';
import { PaginationQueryDto } from '../shared/dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  getAllUsers(@Query() query: PaginationQueryDto) {
    return this.adminService.getAllUsers(query);
  }

  @Post('users')
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.adminService.createUser(createUserDto);
  }

  @Patch('users/:id')
  updateUser(
    @Param('id') id: string,
    @Body() updateData: UpdateUserDto,
    @GetUser() requester: any,
  ) {
    return this.adminService.updateUser(id, updateData, requester.id);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string, @GetUser() requester: any) {
    return this.adminService.deleteUser(id, requester.id);
  }

  @Put('users/:id/status')
  toggleUserStatus(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.adminService.toggleUserStatus(id, body.isActive);
  }

  @Get('orders')
  getAllOrders(@Query() query: PaginationQueryDto) {
    return this.adminService.getAllOrders(query);
  }

  @Get('courses')
  getAllCourses(@Query() query: PaginationQueryDto) {
    return this.adminService.getAllCourses(query);
  }

  @Post('courses')
  createCourse(@Body() createCourseDto: CreateCourseDto) {
    return this.adminService.createCourse(createCourseDto);
  }

  @Put('courses/:id/publish')
  publishCourse(@Param('id') id: string) {
    return this.adminService.publishCourse(id);
  }

  @Put('courses/:id/reject')
  rejectCourse(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.adminService.rejectCourse(id, body.reason);
  }

  @Get('courses/pending')
  getPendingCourses(@Query() query: PaginationQueryDto) {
    return this.adminService.getPendingCourses(query);
  }

  @Post('courses/:id/approve')
  approveCourse(@Param('id') id: string) {
    return this.adminService.publishCourse(id);
  }

  @Post('courses/:id/reject')
  rejectCoursePost(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.adminService.rejectCourse(id, body.reason);
  }

  @Get('stats')
  getStats() {
    return this.adminService.getDashboardStats();
  }

  @Patch('courses/:id')
  updateCourse(@Param('id') id: string, @Body() updateData: UpdateCourseDto) {
    return this.adminService.updateCourse(id, updateData);
  }

  @Delete('courses/:id')
  deleteCourse(@Param('id') id: string) {
    return this.adminService.deleteCourse(id);
  }

  @Get('lessons')
  getAllLessons(@Query() query: PaginationQueryDto) {
    return this.adminService.getAllLessons(query);
  }

  @Post('lessons')
  createLesson(@Body() createLessonDto: CreateLessonDto) {
    return this.adminService.createLesson(createLessonDto);
  }

  @Patch('lessons/:id')
  updateLesson(@Param('id') id: string, @Body() updateData: UpdateLessonDto) {
    return this.adminService.updateLesson(id, updateData);
  }

  @Delete('lessons/:id')
  deleteLesson(@Param('id') id: string) {
    return this.adminService.deleteLesson(id);
  }

  @Get('stats/revenue')
  getStatsRevenue() {
    return this.adminService.getStatsRevenue();
  }

  @Get('stats/revenue/detail')
  getStatsRevenueDetail() {
    return this.adminService.getStatsRevenueDetail();
  }

  @Get('refund-requests')
  getRefundRequests() {
    return this.adminService.getRefundRequests();
  }

  @Patch('refund-requests/:id/paid')
  markRefundPaid(
    @Param('id') id: string,
    @Body() body: { bankTransferRef?: string },
    @GetUser() user: any,
  ) {
    return this.adminService.markRefundPaid(id, user.id, body.bankTransferRef);
  }

  @Get('stats/courses')
  getStatsCourses() {
    return this.adminService.getStatsCourses();
  }

  @Get('queues/health')
  getQueueHealth() {
    return this.adminService.getQueueHealth();
  }

  @Get('queues/:name/failed')
  getFailedJobs(
    @Param('name') name: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getFailedJobs(name, limit ? Number(limit) : 20);
  }
}
