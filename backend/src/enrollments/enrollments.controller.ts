import { Controller, Post, Body, Get, Put, Delete, UseGuards, Request, Param, Query } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Enrollments')
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  /** Free courses only */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('student')
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Enroll in a free course' })
  enroll(@Body() enrollData: { courseId: string }, @Request() req) {
    return this.enrollmentsService.enroll(req.user.id, enrollData.courseId);
  }

  /** Create pending enrollment (for paid courses — called after order+QR) */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('student')
  @ApiBearerAuth()
  @Post('pending')
  @ApiOperation({ summary: 'Create pending enrollment for paid course' })
  createPending(@Body() body: { courseId: string }, @Request() req) {
    return this.enrollmentsService.createPending(req.user.id, body.courseId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-courses')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my enrolled courses' })
  getUserEnrollments(@Request() req) {
    return this.enrollmentsService.getUserEnrollments(req.user.id);
  }

  /** Teacher/admin: list enrollments for a specific course */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get enrollments for a course (teacher/admin)' })
  getEnrollmentsByCourse(
    @Param('courseId') courseId: string,
    @Query('status') status: string,
    @Request() req,
  ) {
    return this.enrollmentsService.getEnrollmentsByCourse(courseId, req.user, status);
  }

  /** Teacher/admin: approve a pending enrollment */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @Put(':id/approve')
  @ApiOperation({ summary: 'Approve pending enrollment' })
  approve(@Param('id') id: string, @Request() req) {
    return this.enrollmentsService.approveEnrollment(id, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Put('progress')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update course progress' })
  updateProgress(
    @Body() progressData: { courseId: string; progress: number },
    @Request() req,
  ) {
    return this.enrollmentsService.updateProgress(
      req.user.id,
      progressData.courseId,
      progressData.progress,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':courseId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unenroll from course' })
  unenroll(@Param('courseId') courseId: string, @Request() req) {
    return this.enrollmentsService.unenroll(req.user.id, courseId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':courseId/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check enrollment status' })
  getEnrollmentStatus(@Param('courseId') courseId: string, @Request() req) {
    return this.enrollmentsService.getEnrollmentStatus(req.user.id, courseId);
  }
}
