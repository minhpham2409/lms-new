import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

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

  async generateQuiz(text: string, count: number = 10) {
    if (!this.genAI) {
      throw new InternalServerErrorException('GEMINI_API_KEY is not configured');
    }

    const schema: Schema = {
      type: SchemaType.ARRAY,
      description: "List of multiple choice questions generated from the text",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          question: {
            type: SchemaType.STRING,
            description: "The question text",
          },
          options: {
            type: SchemaType.ARRAY,
            description: "Exactly 4 options for the multiple choice question",
            items: {
              type: SchemaType.STRING,
            },
          },
          answer: {
            type: SchemaType.STRING,
            description: "The exact text of the correct option",
          },
        },
        required: ["question", "options", "answer"],
      },
    };

    const prompt = `You are an expert educator. Extract and generate exactly ${count} multiple choice questions based on the following text. 
Make sure the questions are clear and accurately reflect the content.
Each question MUST have exactly 4 options.
The answer MUST exactly match one of the options.

Text Content:
"""
${text}
"""`;

    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      });

      const response = result.response.text();
      return JSON.parse(response);
    } catch (error: any) {
      console.error('AI Quiz Generation Error:', error);
      throw new InternalServerErrorException('Failed to generate quiz from AI. ' + error.message);
    }
  }
}
