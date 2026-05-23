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

  findActiveEnrollment(userId: string, courseId: string) {
    return this.prisma.enrollment.findFirst({
      where: { userId, courseId, status: 'active' },
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
        section: {
          include: {
            course: { select: { id: true, title: true } },
          },
        },
        assignments: { select: { id: true, type: true } },
      },
    });
  }

  findLessonWithAssignments(lessonId: string) {
    return this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        assignments: {
          select: {
            id: true,
            type: true,
            quiz: { select: { id: true } },
          },
        },
      },
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

  async upsertVideoProgressMonotonic(data: {
    userId: string;
    lessonId: string;
    watchTime: number;
    completed: boolean;
    watchedPercentage: number;
  }) {
    const existing = await this.findVideoProgress(data.userId, data.lessonId);
    const nextWatchTime = Math.max(existing?.watchTime ?? 0, data.watchTime);
    const nextPercentage = Math.max(
      Number(existing?.watchedPercentage ?? 0),
      data.watchedPercentage,
    );
    const nextCompleted = Boolean(existing?.completed) || data.completed;

    return this.prisma.videoProgress.upsert({
      where: { userId_lessonId: { userId: data.userId, lessonId: data.lessonId } },
      update: {
        watchTime: nextWatchTime,
        watchedPercentage: nextPercentage,
        completed: nextCompleted,
      },
      create: {
        userId: data.userId,
        lessonId: data.lessonId,
        watchTime: nextWatchTime,
        watchedPercentage: nextPercentage,
        completed: nextCompleted,
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

  findQuizAttempt(userId: string, quizId: string) {
    return this.prisma.quizAttempt.findUnique({
      where: { quizId_studentId: { quizId, studentId: userId } },
      select: { id: true, score: true, maxScore: true },
    });
  }

  // ─── Course Queries ──────────────────────────────────────────────────────

  findCourseById(courseId: string) {
    return this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true },
    });
  }
}
