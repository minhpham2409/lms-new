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
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
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

Your task is to identify the MAIN SUBJECT MATTER, concepts, facts, processes, rules, examples, or learning objectives from the document content, then generate exactly ${count} multiple-choice questions in Vietnamese that test understanding of that subject matter.

${difficultyInstruction}

RULES:
- Each question MUST have exactly 4 options.
- The "answer" field MUST exactly match one of the options (character-for-character).
- Questions MUST be about the educational content/topic of the document, not about the document as a file.
- Questions must be written as standalone learning questions about the topic itself. Do NOT mention "tài liệu", "văn bản", "bài viết", "đoạn trích", "nội dung trên", or "theo tài liệu" in any question or option.
- Questions should cover different important ideas from the content.
- All questions and options must be in Vietnamese.
- Make questions clear, unambiguous, and educationally valuable.
- Avoid trivially obvious, administrative, or trick questions.
- DO NOT ask about page numbers, total number of pages, first/last page, file format, document structure, headers, footers, indexes, table of contents, copyright text, timestamps, author names, or where something appears in the document.
- Ignore page labels, slide numbers, line numbers, repeated headers/footers, navigation text, and extraction artifacts.
- If the provided text contains mostly metadata or page numbers, use any meaningful topic text that remains; if there is not enough meaningful content, generate fewer high-quality topic questions instead of inventing page-number questions.
- Good question pattern: ask what a concept means, why something happens, which statement is correct, how to apply an idea, or what conclusion follows from the content.
- Bad question pattern: "Theo tài liệu, ...?", "Trong văn bản, ...?", "Tài liệu nói gì về ...?", "Trang đầu tiên là trang số mấy?", "Văn bản có bao nhiêu trang?", "Trang cuối cùng là trang số mấy?".
- Rewrite metadata-dependent questions into direct topic questions. For example, instead of "Theo tài liệu, trách nhiệm của Team Leader là gì?", ask "Trách nhiệm chính của Team Leader trong báo cáo điểm danh là gì?".

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
