import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Put,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AssignmentsService } from './assignments.service';
import {
  CreateAssignmentDto,
  UpdateAssignmentDto,
  SubmitAssignmentDto,
  GradeSubmissionDto,
} from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';

@ApiTags('Assignments')
@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create assignment for lesson' })
  @ApiResponse({ status: 201, description: 'Assignment created' })
  create(@Body() dto: CreateAssignmentDto, @GetUser() user: any) {
    return this.assignmentsService.create(dto, user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get assignments by lesson' })
  @ApiResponse({ status: 200, description: 'Assignments retrieved' })
  findByLesson(@Query('lessonId') lessonId: string, @GetUser() user: any) {
    if (!lessonId) throw new BadRequestException('lessonId query is required');
    return this.assignmentsService.findByLesson(lessonId, user);
  }

  @Get(':id/my-submission')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('student')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current student submission for this assignment' })
  @ApiResponse({ status: 200, description: 'Submission or null' })
  getMySubmission(@Param('id') id: string, @GetUser() user: any) {
    return this.assignmentsService.getMySubmission(id, user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get assignment by id' })
  @ApiResponse({ status: 200, description: 'Assignment retrieved' })
  findOne(@Param('id') id: string, @GetUser() user: any) {
    return this.assignmentsService.findOne(id, user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update assignment' })
  @ApiResponse({ status: 200, description: 'Assignment updated' })
  update(@Param('id') id: string, @Body() dto: UpdateAssignmentDto, @GetUser() user: any) {
    return this.assignmentsService.update(id, dto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete assignment' })
  @ApiResponse({ status: 200, description: 'Assignment deleted' })
  remove(@Param('id') id: string, @GetUser() user: any) {
    return this.assignmentsService.remove(id, user.id);
  }

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('student')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit assignment (essay)' })
  @ApiResponse({ status: 201, description: 'Submission created' })
  submit(@Param('id') id: string, @Body() dto: SubmitAssignmentDto, @GetUser() user: any) {
    return this.assignmentsService.submit(id, dto, user.id);
  }

  @Get(':id/submissions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get submissions for assignment' })
  @ApiResponse({ status: 200, description: 'Submissions retrieved' })
  getSubmissions(@Param('id') id: string, @GetUser() user: any) {
    return this.assignmentsService.getSubmissions(id, user.id);
  }
}
