import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseRepository } from './base.repository';
import { Submission } from '@prisma/client';

@Injectable()
export class SubmissionRepository extends BaseRepository<Submission> {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  get model() {
    return this.prisma.submission;
  }

  findByAssignmentAndStudent(assignmentId: string, studentId: string) {
    return this.prisma.submission.findUnique({
      where: { assignmentId_studentId: { assignmentId, studentId } },
    });
  }

  findByAssignmentId(assignmentId: string) {
    return this.prisma.submission.findMany({
      where: { assignmentId },
      include: {
        student: { select: { id: true, username: true, firstName: true, lastName: true } },
      },
    });
  }

  findByStudentId(studentId: string) {
    return this.prisma.submission.findMany({
      where: { studentId },
      include: { assignment: true },
    });
  }

  /** All submissions for courses taught by this teacher */
  findByTeacher(teacherId: string) {
    return this.prisma.submission.findMany({
      where: {
        assignment: {
          lesson: {
            section: {
              course: { authorId: teacherId },
            },
          },
        },
      },
      include: {
        student: {
          select: { id: true, username: true, firstName: true, lastName: true, email: true },
        },
        assignment: {
          select: {
            id: true, title: true, maxScore: true, description: true,
            lesson: {
              select: {
                id: true, title: true,
                section: {
                  select: {
                    id: true, title: true,
                    course: { select: { id: true, title: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
