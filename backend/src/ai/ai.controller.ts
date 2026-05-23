import { Controller, Post, Body, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AiService, QuizDifficulty } from './ai.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { DocumentParserService } from './document-parser.service';

export class GenerateQuizDto {
  text: string;
  count?: number;
  difficulty?: QuizDifficulty;
}

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly documentParser: DocumentParserService,
  ) {}

  @Post('generate-quiz')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate multiple choice questions from text using AI' })
  @ApiResponse({ status: 201, description: 'Questions generated' })
  generateQuiz(@Body() dto: GenerateQuizDto) {
    return this.aiService.generateQuiz(dto.text, dto.count, dto.difficulty);
  }

  @Post('generate-quiz-from-file')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate quiz from uploaded document file (PDF, DOCX, PPTX, XLSX, TXT, CSV)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        count: { type: 'number' },
        difficulty: { type: 'string', enum: ['easy', 'medium', 'hard', 'mixed'] },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async generateQuizFromFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { count?: string; difficulty?: QuizDifficulty },
  ) {
    if (!file) throw new BadRequestException('No file uploaded');

    const text = await this.documentParser.parse(file);
    const count = body.count ? parseInt(body.count, 10) : 10;
    const difficulty = body.difficulty || 'mixed';

    return this.aiService.generateQuiz(text, count, difficulty);
  }
}
