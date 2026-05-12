import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseRepository } from './base.repository';
import { Lesson } from '@prisma/client';

@Injectable()
export class LessonRepository extends BaseRepository<Lesson> {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  get model() {
    return this.prisma.lesson;
  }

  findByIdWithSection(id: string) {
    return this.prisma.lesson.findUnique({
      where: { id },
      include: {
        section: {
          include: { course: { select: { id: true, title: true, authorId: true, status: true } } },
        },
      },
    });
  }

  findAllWithSectionAndCourse() {
    return this.prisma.lesson.findMany({
      include: {
        section: {
          include: {
            course: { select: { id: true, title: true } },
          },
        },
      },
    });
  }

  async getNextOrder(sectionId: string): Promise<number> {
    const lastLesson = await this.prisma.lesson.findFirst({
      where: { sectionId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    return lastLesson ? lastLesson.order + 1 : 1;
  }

  createWithOrder(data: {
    title: string;
    content?: string;
    videoUrl?: string;
    duration?: number;
    sectionId: string;
    order: number;
  }) {
    return this.prisma.lesson.create({
      data,
      include: {
        section: {
          include: { course: { select: { id: true, title: true } } },
        },
      },
    });
  }

  updateWithIncludes(id: string, data: any) {
    return this.prisma.lesson.update({
      where: { id },
      data,
      include: {
        section: {
          include: { course: { select: { id: true, title: true } } },
        },
      },
    });
  }
}
