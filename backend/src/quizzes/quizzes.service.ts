import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuizRepository, AssignmentRepository } from '../database/repositories';
import { CreateQuizDto, CreateQuestionDto, SubmitQuizDto } from './dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class QuizzesService {
  constructor(
    private readonly quizRepository: QuizRepository,
    private readonly assignmentRepository: AssignmentRepository,
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /** Same rules as assignments: admin; teacher = course author; student = published + enrolled. */
  private async assertLearnerOrStaffOnCourse(
    user: { id: string; role: string },
    course: { id: string; authorId: string; status: string },
  ) {
    if (user.role === 'admin') return;
    if (user.role === 'teacher') {
      if (course.authorId !== user.id) {
        throw new ForbiddenException('You can only access quizzes in your own courses');
      }
      return;
    }
    if (user.role === 'student') {
      if (course.status !== 'published') {
        throw new ForbiddenException('This course is not available');
      }
      const enr = await this.prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: user.id, courseId: course.id } },
      });
      if (!enr) {
        throw new ForbiddenException('You must be enrolled in this course to access quizzes');
      }
      return;
    }
    throw new ForbiddenException();
  }

  private async getAssignmentOwner(assignmentId: string) {
    const assignment = await this.assignmentRepository.findByIdWithLesson(assignmentId);
    if (!assignment) throw new NotFoundException('Assignment not found');
    return assignment;
  }

  async create(dto: CreateQuizDto, authorId: string) {
    const assignment = await this.getAssignmentOwner(dto.assignmentId);
    if (assignment.lesson.section.course.authorId !== authorId) {
      throw new ForbiddenException('You can only add quizzes to your own assignments');
    }
    if (assignment.type !== 'quiz') {
      throw new BadRequestException('Assignment type must be quiz');
    }
    if (assignment.quiz) {
      throw new ConflictException('Quiz already exists for this assignment');
    }

    return this.quizRepository.create({
      assignmentId: dto.assignmentId,
      timeLimit: dto.timeLimit,
    });
  }

  async findOne(id: string, user: { id: string; role: string }) {
    const quiz = await this.quizRepository.findByIdWithQuestions(id);
    if (!quiz) throw new NotFoundException('Quiz not found');
    const assignment = await this.assignmentRepository.findByIdWithLesson(quiz.assignmentId);
    if (!assignment) throw new NotFoundException('Assignment not found');
    await this.assertLearnerOrStaffOnCourse(user, assignment.lesson.section.course);
    return quiz;
  }

  async addQuestion(dto: CreateQuestionDto, authorId: string) {
    const quiz = await this.quizRepository.findById(dto.quizId);
    if (!quiz) throw new NotFoundException('Quiz not found');

    const assignment = await this.getAssignmentOwner(quiz.assignmentId);
    if (assignment.lesson.section.course.authorId !== authorId) {
      throw new ForbiddenException('You can only add questions to your own quizzes');
    }

    const order = await this.quizRepository.getNextQuestionOrder(dto.quizId);

    return this.quizRepository.createQuestion({
      quizId: dto.quizId,
      content: dto.content,
      options: JSON.stringify(dto.options),
      answer: dto.answer,
      score: dto.score ?? 1,
      order,
    });
  }

  async submit(id: string, dto: SubmitQuizDto, studentId: string) {
    const quiz = await this.quizRepository.findByIdWithQuestions(id);
    if (!quiz) throw new NotFoundException('Quiz not found');
    const assignment = await this.assignmentRepository.findByIdWithLesson(quiz.assignmentId);
    if (!assignment) throw new NotFoundException('Assignment not found');
    await this.assertLearnerOrStaffOnCourse(
      { id: studentId, role: 'student' },
      assignment.lesson.section.course,
    );

    const existing = await this.quizRepository.getAttempt(id, studentId);
    if (existing) throw new ConflictException('You have already submitted this quiz');

    let score = 0;
    const maxScore = quiz.questions.reduce((sum, q) => sum + q.score, 0);

    for (const question of quiz.questions) {
      const studentAnswer = dto.answers.find(a => a.questionId === question.id);
      if (studentAnswer && studentAnswer.answerId === question.answer) {
        score += question.score;
      }
    }

    const attempt = await this.quizRepository.createAttempt({
      quizId: id,
      studentId,
      answers: JSON.stringify(dto.answers),
      score,
      maxScore,
    });

    this.notificationsService.notifyUser(studentId, {
      title: 'Quiz submitted',
      message: `You scored ${score} / ${maxScore} on "${assignment.title}".`,
      type: 'success',
    });

    return attempt;
  }

  /** Teacher/admin: all student attempts for a quiz (auto-graded scores). */
  async listAttempts(quizId: string, user: { id: string; role: string }) {
    const quiz = await this.quizRepository.findById(quizId);
    if (!quiz) throw new NotFoundException('Quiz not found');
    const assignment = await this.assignmentRepository.findByIdWithLesson(quiz.assignmentId);
    if (!assignment) throw new NotFoundException('Assignment not found');
    if (user.role === 'admin') {
      return this.quizRepository.findAttemptsByQuizId(quizId);
    }
    if (user.role === 'teacher') {
      if (assignment.lesson.section.course.authorId !== user.id) {
        throw new ForbiddenException('You can only view attempts for your own courses');
      }
      return this.quizRepository.findAttemptsByQuizId(quizId);
    }
    throw new ForbiddenException();
  }

  async getResult(id: string, studentId: string) {
    const quiz = await this.quizRepository.findById(id);
    if (!quiz) throw new NotFoundException('Quiz not found');
    const assignment = await this.assignmentRepository.findByIdWithLesson(quiz.assignmentId);
    if (!assignment) throw new NotFoundException('Assignment not found');
    await this.assertLearnerOrStaffOnCourse(
      { id: studentId, role: 'student' },
      assignment.lesson.section.course,
    );

    const attempt = await this.quizRepository.getAttempt(id, studentId);
    if (!attempt) throw new NotFoundException('No submission found for this quiz');

    const answers = JSON.parse(attempt.answers);
    const questions = attempt.quiz.questions.map(q => ({
      id: q.id,
      content: q.content,
      options: JSON.parse(q.options),
      correctAnswer: q.answer,
      studentAnswer: answers.find((a: any) => a.questionId === q.id)?.answerId ?? null,
      score: q.score,
    }));

    return {
      score: attempt.score,
      maxScore: attempt.maxScore,
      percentage: attempt.maxScore > 0 ? (attempt.score / attempt.maxScore) * 100 : 0,
      completedAt: attempt.createdAt,
      questions,
    };
  }
}
