import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

export type QuizDifficulty = 'easy' | 'medium' | 'hard' | 'mixed';

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      // Use flash for speed and cost-effectiveness
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }
  }

  async generateQuiz(
    text: string,
    count: number = 10,
    difficulty: QuizDifficulty = 'mixed',
  ) {
    if (!this.genAI) {
      throw new InternalServerErrorException('GEMINI_API_KEY is not configured');
    }

    const schema: Schema = {
      type: SchemaType.ARRAY,
      description: 'List of multiple choice questions generated from the text',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          question: {
            type: SchemaType.STRING,
            description: 'The question text',
          },
          options: {
            type: SchemaType.ARRAY,
            description: 'Exactly 4 options for the multiple choice question',
            items: {
              type: SchemaType.STRING,
            },
          },
          answer: {
            type: SchemaType.STRING,
            description: 'The exact text of the correct option',
          },
          difficulty: {
            type: SchemaType.STRING,
            description: 'Difficulty level: easy, medium, or hard',
          },
        },
        required: ['question', 'options', 'answer', 'difficulty'],
      },
    };

    const difficultyInstruction = this.getDifficultyInstruction(difficulty, count);

    const prompt = `You are an expert Vietnamese educator specializing in creating high-quality exam questions.

Based on the following text/document content, generate exactly ${count} multiple-choice questions in Vietnamese.

${difficultyInstruction}

RULES:
- Each question MUST have exactly 4 options.
- The "answer" field MUST exactly match one of the options (character-for-character).
- Questions should cover different aspects of the content.
- All questions and options must be in Vietnamese.
- Make questions clear, unambiguous, and educationally valuable.
- Avoid trivially obvious or trick questions.

Text Content:
"""
${text}
"""`;

    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: schema,
        },
      });

      const response = result.response.text();
      return JSON.parse(response);
    } catch (error: any) {
      console.error('AI Quiz Generation Error:', error);
      throw new InternalServerErrorException(
        'Failed to generate quiz from AI. ' + error.message,
      );
    }
  }

  private getDifficultyInstruction(
    difficulty: QuizDifficulty,
    count: number,
  ): string {
    switch (difficulty) {
      case 'easy':
        return `DIFFICULTY: All ${count} questions should be EASY level.
- Focus on basic recall and understanding.
- Questions should test fundamental concepts and definitions.
- Mark all questions with difficulty: "easy".`;

      case 'medium':
        return `DIFFICULTY: All ${count} questions should be MEDIUM level.
- Focus on application and analysis.
- Questions should require understanding relationships between concepts.
- Mark all questions with difficulty: "medium".`;

      case 'hard':
        return `DIFFICULTY: All ${count} questions should be HARD level.
- Focus on evaluation, synthesis, and critical thinking.
- Questions should require deep understanding and the ability to apply knowledge in new situations.
- Mark all questions with difficulty: "hard".`;

      case 'mixed':
      default: {
        const easy = Math.ceil(count * 0.3);
        const medium = Math.ceil(count * 0.4);
        const hard = count - easy - medium;
        return `DIFFICULTY: Generate a MIX of difficulty levels:
- ${easy} EASY questions (basic recall, definitions) — mark with difficulty: "easy"
- ${medium} MEDIUM questions (application, analysis) — mark with difficulty: "medium"
- ${hard} HARD questions (evaluation, synthesis) — mark with difficulty: "hard"`;
      }
    }
  }
}
