import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CommentRepository } from '../database/repositories';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto';

@Injectable()
export class CommentsService {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly prisma: PrismaService,
  ) {}

  private async getLessonWithCourse(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { section: true },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    return lesson;
  }

  private async checkAccess(lessonId: string, userId: string, userRole: string) {
    const lesson = await this.getLessonWithCourse(lessonId);

    // Teachers and admins can comment without being enrolled
    if (userRole === 'teacher' || userRole === 'admin') {
      return lesson;
    }

    // Students must be enrolled
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { userId, courseId: lesson.section.courseId },
    });
    if (!enrollment) throw new ForbiddenException('You must be enrolled to comment');
    return lesson;
  }

  async create(lessonId: string, dto: CreateCommentDto, userId: string, userRole: string) {
    await this.checkAccess(lessonId, userId, userRole);
    return this.commentRepository.create({ lessonId, userId, content: dto.content });
  }

  async findByLesson(lessonId: string, userId: string, userRole: string) {
    await this.checkAccess(lessonId, userId, userRole);
    return this.commentRepository.findByLesson(lessonId);
  }

  async reply(lessonId: string, commentId: string, dto: CreateCommentDto, userId: string, userRole: string) {
    await this.checkAccess(lessonId, userId, userRole);

    const parent = await this.commentRepository.findById(commentId);
    if (!parent) throw new NotFoundException('Comment not found');
    if (parent.lessonId !== lessonId) throw new NotFoundException('Comment not found');

    return this.commentRepository.create({
      lessonId,
      userId,
      content: dto.content,
      parentId: commentId,
    });
  }
}
