import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseRepository } from './base.repository';
import { Review } from '@prisma/client';

@Injectable()
export class ReviewRepository extends BaseRepository<Review> {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  get model() {
    return this.prisma.review;
  }

  findByCourse(courseId: string) {
    return this.prisma.review.findMany({
      where: { courseId },
      include: { user: { select: { id: true, username: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  findByUserAndCourse(userId: string, courseId: string) {
    return this.prisma.review.findUnique({
      where: { courseId_userId: { courseId, userId } },
    });
  }
}
