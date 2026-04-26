import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseRepository } from './base.repository';
import { Course } from '@prisma/client';

@Injectable()
export class CourseRepository extends BaseRepository<Course> {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  get model() {
    return this.prisma.course;
  }

  findAllWithCounts(where?: { status?: string }) {
    return this.prisma.course.findMany({
      where: where ?? {},
      include: {
        author: { select: { id: true, username: true } },
        _count: { select: { sections: true, enrollments: true } },
      },
    });
  }

  findByIdWithSections(id: string) {
    return this.prisma.course.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, username: true } },
        sections: {
          orderBy: { order: 'asc' },
          include: {
            lessons: { orderBy: { order: 'asc' } },
          },
        },
        _count: { select: { enrollments: true } },
      },
    });
  }

  createWithAuthor(data: any, authorId: string) {
    return this.prisma.course.create({
      data: { ...data, authorId, status: data.status ?? 'draft' },
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
          include: { lessons: { orderBy: { order: 'asc' } } },
        },
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  search(q: string, publishedOnly = true) {
    return this.prisma.course.findMany({
      where: {
        ...(publishedOnly ? { status: 'published' } : {}),
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
