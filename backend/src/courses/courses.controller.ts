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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';

import { ReviewsService } from '../reviews/reviews.service';

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly reviewsService: ReviewsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a course' })
  @ApiResponse({ status: 201, description: 'Course created' })
  create(@Body() dto: CreateCourseDto, @GetUser() user: any) {
    return this.coursesService.create(dto, user.id);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search courses' })
  @ApiResponse({ status: 200, description: 'Courses found' })
  search(@Query('q') q: string) {
    return this.coursesService.search(q);
  }

  @Get()
  @ApiOperation({ summary: 'Get all courses' })
  @ApiResponse({ status: 200, description: 'Courses retrieved' })
  findAll() {
    return this.coursesService.findAll();
  }

  @Get('my/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get teacher stats' })
  @ApiResponse({ status: 200, description: 'Teacher stats retrieved' })
  getTeacherStats(@GetUser() user: any) {
    return this.coursesService.getTeacherStats(user.id);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my courses (teacher)' })
  @ApiResponse({ status: 200, description: 'Teacher courses retrieved' })
  findMyCourses(@GetUser() user: any) {
    return this.coursesService.findByAuthor(user.id);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get course by id (draft/pending visible to author or admin)' })
  @ApiResponse({ status: 200, description: 'Course retrieved' })
  @ApiBearerAuth()
  findOne(@Param('id') id: string, @GetUser() user: { id: string; role: string } | undefined) {
    return this.coursesService.findOne(
      id,
      user ? { id: user.id, role: user.role } : null,
    );
  }

  @Patch(':id')
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update course' })
  @ApiResponse({ status: 200, description: 'Course updated' })
  update(@Param('id') id: string, @Body() dto: UpdateCourseDto, @GetUser() user: any) {
    return this.coursesService.update(id, dto, {
      id: user.id,
      role: user.role,
    });
  }

  @Post(':id/submit-review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit course for review' })
  @ApiResponse({ status: 200, description: 'Course submitted for review' })
  submitReview(@Param('id') id: string, @GetUser() user: any) {
    return this.coursesService.submitForReview(id, user.id);
  }

  @Get(':id/reviews')
  @ApiOperation({ summary: 'Get reviews for course' })
  @ApiResponse({ status: 200, description: 'Reviews retrieved' })
  getReviews(@Param('id') id: string) {
    return this.reviewsService.findByCourse(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete course' })
  @ApiResponse({ status: 200, description: 'Course deleted' })
  remove(@Param('id') id: string, @GetUser() user: any) {
    return this.coursesService.remove(id, user.id);
  }
}
