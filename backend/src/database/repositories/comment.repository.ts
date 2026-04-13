import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseRepository } from './base.repository';
import { Comment } from '@prisma/client';

@Injectable()
export class CommentRepository extends BaseRepository<Comment> {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  get model() {
    return this.prisma.comment;
  }

  findByLesson(lessonId: string) {
    return this.prisma.comment.findMany({
      where: { lessonId, parentId: null },
      include: {
        user: { select: { id: true, username: true, firstName: true, lastName: true } },
        replies: {
          include: {
            user: { select: { id: true, username: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
