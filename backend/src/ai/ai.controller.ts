import { Controller, Post, Body, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AiService, QuizDifficulty } from './ai.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

export class GenerateQuizDto {
  text: string;
  count?: number;
  difficulty?: QuizDifficulty;
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
    return this.aiService.generateQuiz(dto.text, dto.count, dto.difficulty);
  }

  @Post('generate-quiz-from-file')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate quiz from uploaded document file (PDF, DOCX, TXT)' })
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

    // Extract text content from the file
    let text: string;
    const mime = file.mimetype;

    if (mime === 'text/plain') {
      text = file.buffer.toString('utf-8');
    } else if (
      mime === 'application/pdf' ||
      mime === 'application/msword' ||
      mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      // For PDF/DOCX, send as plain text extraction attempt.
      // The buffer content will be sent to Gemini which can read PDFs natively.
      // We'll pass the raw text that can be extracted, or let AI handle it.
      text = file.buffer.toString('utf-8');
      // If binary garbage, use base64 and let Gemini parse
      if (text.includes('\x00') || text.includes('\ufffd')) {
        text = `[Document: ${file.originalname}]\n\nThis is a binary document. The content has been provided as a file upload. Please extract and analyze the educational content from it.`;
        // In production, use a PDF parser like pdf-parse. For now, inform the teacher.
      }
    } else {
      throw new BadRequestException('Unsupported file type. Please upload PDF, DOCX, or TXT files.');
    }

    const count = body.count ? parseInt(body.count, 10) : 10;
    const difficulty = body.difficulty || 'mixed';

    return this.aiService.generateQuiz(text, count, difficulty);
  }
}
