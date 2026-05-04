import { Controller, Post, Body, Get, Put, Delete, UseGuards, Request, Param } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Enrollments')
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  /** Free courses only — paid courses must go through payment flow */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('student')
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Enroll in a free course (paid courses require payment)' })
  enroll(@Body() enrollData: { courseId: string }, @Request() req) {
    return this.enrollmentsService.enroll(req.user.id, enrollData.courseId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-courses')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my enrolled courses' })
  getUserEnrollments(@Request() req) {
    return this.enrollmentsService.getUserEnrollments(req.user.id);
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

