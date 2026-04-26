import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseRepository } from './base.repository';
import { Quiz } from '@prisma/client';

@Injectable()
export class QuizRepository extends BaseRepository<Quiz> {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  get model() {
    return this.prisma.quiz;
  }

  findByIdWithQuestions(id: string) {
    return this.prisma.quiz.findUnique({
      where: { id },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
  }

  findByAssignmentId(assignmentId: string) {
    return this.prisma.quiz.findUnique({
      where: { assignmentId },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
  }

  getAttempt(quizId: string, studentId: string) {
    return this.prisma.quizAttempt.findUnique({
      where: { quizId_studentId: { quizId, studentId } },
      include: { quiz: { include: { questions: { orderBy: { order: 'asc' } } } } },
    });
  }

  createAttempt(data: {
    quizId: string;
    studentId: string;
    answers: string;
    score: number;
    maxScore: number;
  }) {
    return this.prisma.quizAttempt.create({ data });
  }

  findAttemptsByQuizId(quizId: string) {
    return this.prisma.quizAttempt.findMany({
      where: { quizId },
      include: {
        student: { select: { id: true, username: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  getNextQuestionOrder(quizId: string) {
    return this.prisma.question
      .findFirst({ where: { quizId }, orderBy: { order: 'desc' }, select: { order: true } })
      .then(q => (q ? q.order + 1 : 1));
  }

  createQuestion(data: {
    quizId: string;
    content: string;
    options: string;
    answer: string;
    score: number;
    order: number;
  }) {
    return this.prisma.question.create({ data });
  }
}
