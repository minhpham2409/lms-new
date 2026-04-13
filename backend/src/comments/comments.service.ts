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

  private async checkEnrolled(lessonId: string, userId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { section: true },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    const enrollment = await this.prisma.enrollment.findFirst({
      where: { userId, courseId: lesson.section.courseId },
    });
    if (!enrollment) throw new ForbiddenException('You must be enrolled to comment');
    return lesson;
  }

  async create(lessonId: string, dto: CreateCommentDto, userId: string) {
    await this.checkEnrolled(lessonId, userId);
    return this.commentRepository.create({ lessonId, userId, content: dto.content });
  }

  async findByLesson(lessonId: string, userId: string) {
    await this.checkEnrolled(lessonId, userId);
    return this.commentRepository.findByLesson(lessonId);
  }

  async reply(lessonId: string, commentId: string, dto: CreateCommentDto, userId: string) {
    await this.checkEnrolled(lessonId, userId);

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
