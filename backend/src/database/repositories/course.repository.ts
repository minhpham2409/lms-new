import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseRepository } from './base.repository';
import { Course, CourseStatus, OrderStatus } from '@prisma/client';

@Injectable()
export class CourseRepository extends BaseRepository<Course> {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  get model() {
    return this.prisma.course;
  }

  findAllWithCounts(where?: { status?: CourseStatus }, options?: { skip?: number; take?: number }) {
    return this.prisma.course.findMany({
      where: where ?? {},
      include: {
        author: { select: { id: true, username: true, firstName: true, lastName: true } },
        sections: {
          include: {
            _count: { select: { lessons: true } },
          },
        },
        _count: { select: { enrollments: true } },
      },
      skip: options?.skip,
      take: options?.take ?? 50,
      orderBy: { createdAt: 'desc' },
    });
  }

  findByIdWithSections(id: string) {
    return this.prisma.course.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, username: true, firstName: true, lastName: true } },
        sections: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              include: {
                materials: true,
                assignments: {
                  include: {
                    submissions: { select: { id: true, status: true } },
                  },
                },
              },
            },
          },
        },
        _count: { select: { enrollments: true } },
        reviews: { select: { rating: true } },
      },
    });
  }

  createWithAuthor(data: any, authorId: string) {
    return this.prisma.course.create({
      data: { ...data, authorId },
      include: {
        author: { select: { id: true, username: true } },
      },
    });
  }

  findByAuthorId(authorId: string) {
    return this.prisma.course.findMany({
      where: { authorId },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              include: { materials: true, assignments: true },
            },
            _count: { select: { lessons: true } },
          },
        },
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Data queries for teacher dashboard stats */
  async getTeacherStatsData(authorId: string) {
    return Promise.all([
      this.prisma.course.findMany({
        where: { authorId },
        include: { _count: { select: { enrollments: true } } },
      }),
      this.prisma.enrollment.findMany({
        where: { course: { authorId } },
        select: { userId: true, createdAt: true },
      }),
      this.prisma.review.findMany({
        where: { course: { authorId } },
        select: { rating: true },
      }),
      this.prisma.orderItem.findMany({
        where: {
          order: { status: OrderStatus.paid },
          course: { authorId },
        },
        include: { order: { select: { createdAt: true } } },
      }),
      this.prisma.enrollment.findMany({
        where: { course: { authorId } },
        include: {
          user: { select: { id: true, username: true } },
          course: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);
  }

  search(q: string, publishedOnly = true) {
    return this.prisma.course.findMany({
      where: {
        ...(publishedOnly ? { status: CourseStatus.published } : {}),
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
        ],
      },
      include: {
        author: { select: { id: true, username: true } },
        _count: { select: { sections: true, enrollments: true } },
      },
    });
  }
}
