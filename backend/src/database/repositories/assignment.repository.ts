import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseRepository } from './base.repository';
import { Assignment } from '@prisma/client';

@Injectable()
export class AssignmentRepository extends BaseRepository<Assignment> {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  get model() {
    return this.prisma.assignment;
  }

  findByLessonId(lessonId: string) {
    return this.prisma.assignment.findMany({
      where: { lessonId },
      include: { quiz: true },
    });
  }

  findByIdWithSubmissions(id: string) {
    return this.prisma.assignment.findUnique({
      where: { id },
      include: {
        submissions: {
          include: {
            student: { select: { id: true, username: true, firstName: true, lastName: true } },
          },
        },
        quiz: { include: { questions: { orderBy: { order: 'asc' } } } },
      },
    });
  }

  findByIdWithLesson(id: string) {
    return this.prisma.assignment.findUnique({
      where: { id },
      include: {
        lesson: {
          include: { section: { include: { course: true } } },
        },
        quiz: true,
      },
    });
  }

  findLessonWithCourse(lessonId: string) {
    return this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { section: { include: { course: true } } },
    });
  }
}
