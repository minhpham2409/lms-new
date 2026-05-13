import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProgressRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Enrollment Progress ─────────────────────────────────────────────────

  findEnrollment(userId: string, courseId: string) {
    return this.prisma.enrollment.findFirst({
      where: { userId, courseId },
    });
  }

  findEnrollmentsWithCourse(userId: string) {
    return this.prisma.enrollment.findMany({
      where: { userId },
      include: { course: { select: { id: true, title: true } } },
    });
  }

  updateEnrollmentProgress(enrollmentId: string, progress: number) {
    return this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { progress },
    });
  }

  // ─── Lesson Queries ──────────────────────────────────────────────────────

  findLessonWithDetails(lessonId: string) {
    return this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        section: true,
        assignments: { select: { id: true } },
      },
    });
  }

  findLessonWithAssignments(lessonId: string) {
    return this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { assignments: { select: { id: true } } },
    });
  }

  findLessonsByCourse(courseId: string) {
    return this.prisma.lesson.findMany({
      where: { section: { courseId } },
      orderBy: { order: 'asc' },
    });
  }

  countLessonsByCourse(courseId: string) {
    return this.prisma.lesson.count({
      where: { section: { courseId } },
    });
  }

  // ─── Video Progress ──────────────────────────────────────────────────────

  findVideoProgress(userId: string, lessonId: string) {
    return this.prisma.videoProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });
  }

  upsertVideoProgress(data: {
    userId: string;
    lessonId: string;
    watchTime?: number;
    completed?: boolean;
    watchedPercentage: number;
  }) {
    return this.prisma.videoProgress.upsert({
      where: { userId_lessonId: { userId: data.userId, lessonId: data.lessonId } },
      update: {
        ...(data.watchTime !== undefined && { watchTime: data.watchTime }),
        ...(data.completed !== undefined && { completed: data.completed }),
        watchedPercentage: data.watchedPercentage,
      },
      create: {
        userId: data.userId,
        lessonId: data.lessonId,
        watchTime: data.watchTime || 0,
        completed: data.completed || false,
        watchedPercentage: data.watchedPercentage,
      },
    });
  }

  countCompletedLessons(userId: string, courseId: string) {
    return this.prisma.videoProgress.count({
      where: { userId, completed: true, lesson: { section: { courseId } } },
    });
  }

  findVideoProgressByCourse(userId: string, courseId: string) {
    return this.prisma.videoProgress.findMany({
      where: {
        userId,
        lesson: { section: { courseId } },
      },
    });
  }

  // ─── Submission Queries ──────────────────────────────────────────────────

  findSubmissionForLesson(userId: string, lessonId: string) {
    return this.prisma.submission.findFirst({
      where: { studentId: userId, assignment: { lessonId } },
    });
  }

  findSubmissionForAssignment(userId: string, assignmentId: string) {
    return this.prisma.submission.findFirst({
      where: { studentId: userId, assignmentId },
      select: { id: true, status: true, score: true },
    });
  }
}
