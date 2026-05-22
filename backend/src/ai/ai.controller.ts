import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

export class GenerateQuizDto {
  text: string;
  count?: number;
}

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-quiz')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate multiple choice questions from text using AI' })
  @ApiResponse({ status: 201, description: 'Questions generated' })
  generateQuiz(@Body() dto: GenerateQuizDto) {
    return this.aiService.generateQuiz(dto.text, dto.count);
  }
}
