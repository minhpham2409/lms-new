import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto, CreateQuestionDto, SubmitQuizDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';

@ApiTags('Quizzes')
@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create quiz for assignment' })
  @ApiResponse({ status: 201, description: 'Quiz created' })
  create(@Body() dto: CreateQuizDto, @GetUser() user: any) {
    return this.quizzesService.create(dto, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quiz by id' })
  @ApiResponse({ status: 200, description: 'Quiz retrieved' })
  findOne(@Param('id') id: string) {
    return this.quizzesService.findOne(id);
  }

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('student')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit quiz answers (auto-graded)' })
  @ApiResponse({ status: 201, description: 'Quiz submitted' })
  submit(@Param('id') id: string, @Body() dto: SubmitQuizDto, @GetUser() user: any) {
    return this.quizzesService.submit(id, dto, user.id);
  }

  @Get(':id/result')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get quiz result' })
  @ApiResponse({ status: 200, description: 'Quiz result retrieved' })
  getResult(@Param('id') id: string, @GetUser() user: any) {
    return this.quizzesService.getResult(id, user.id);
  }
}
