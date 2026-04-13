import { Controller, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AssignmentsService } from '../assignments/assignments.service';
import { GradeSubmissionDto } from '../assignments/dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';

@ApiTags('Submissions')
@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Put(':id/grade')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Grade a submission' })
  @ApiResponse({ status: 200, description: 'Submission graded' })
  grade(@Param('id') id: string, @Body() dto: GradeSubmissionDto, @GetUser() user: any) {
    return this.assignmentsService.gradeSubmission(id, dto, user.id);
  }
}
