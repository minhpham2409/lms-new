import { Controller, Post, Body, UseGuards, Param, Put, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { QuizzesService } from './quizzes.service';
import { CreateQuestionDto, CreateBulkQuestionsDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

class UpdateQuestionDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsArray()
  options: { id: string; text: string }[];

  @IsNotEmpty()
  @IsString()
  answer: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  score?: number;
}

@ApiTags('Questions')
@Controller('questions')
export class QuestionsController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add question to quiz' })
  @ApiResponse({ status: 201, description: 'Question added' })
  create(@Body() dto: CreateQuestionDto, @GetUser() user: any) {
    return this.quizzesService.addQuestion(dto, user.id);
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add multiple questions to quiz' })
  @ApiResponse({ status: 201, description: 'Questions added' })
  createBulk(@Body() dto: CreateBulkQuestionsDto, @GetUser() user: any) {
    return this.quizzesService.addBulkQuestions(dto, user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update question' })
  @ApiResponse({ status: 200, description: 'Question updated' })
  update(@Param('id') id: string, @Body() dto: UpdateQuestionDto, @GetUser() user: any) {
    return this.quizzesService.updateQuestion(id, dto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete question' })
  @ApiResponse({ status: 200, description: 'Question deleted' })
  remove(@Param('id') id: string, @GetUser() user: any) {
    return this.quizzesService.removeQuestion(id, user.id);
  }
}
