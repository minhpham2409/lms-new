import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateVideoProgressDto } from './dto/update-video-progress.dto';

@Injectable()
export class ProgressService {
  constructor(private prisma: PrismaService) {}

  async getUserProgress(userId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { userId, courseId },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    return { progress: enrollment.progress, lastAccessed: enrollment.updatedAt };
  }

  async updateProgress(userId: string, courseId: string, progress: number) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { userId, courseId },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    return this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { progress },
    });
  }

  async getCoursesProgress(userId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      include: { course: { select: { id: true, title: true } } },
    });

    return enrollments.map(enrollment => ({
      courseId: enrollment.courseId,
      courseTitle: enrollment.course.title,
      progress: enrollment.progress,
      lastAccessed: enrollment.updatedAt,
    }));
  }

  async updateVideoProgress(userId: string, dto: UpdateVideoProgressDto) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: dto.lessonId },
      include: {
        section: true,
        assignments: {
          select: { id: true },
        },
      },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    const courseId = lesson.section.courseId;
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { userId, courseId },
    });
    if (!enrollment) throw new NotFoundException('User is not enrolled in this course');

    // Get current video progress to track max watched percentage
    const currentProgress = await this.prisma.videoProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId: dto.lessonId } },
    });

    // Calculate new watched percentage (keep the highest value)
    const newPercentage = dto.watchedPercentage || 0;
    const maxPercentage = Math.max(currentProgress?.watchedPercentage || 0, newPercentage);

    // If trying to complete the lesson, enforce checks
    if (dto.completed) {
      // Check 1: Video must be watched at least 80% (if lesson has video)
      if (lesson.videoUrl && maxPercentage < 80) {
        throw new BadRequestException(
          `Bạn cần xem ít nhất 80% video trước khi hoàn thành bài học. Hiện tại: ${Math.round(maxPercentage)}%`
        );
      }

      // Check 2: If the lesson has assignments, check that student submitted at least one
      if (lesson.assignments.length > 0) {
        const submission = await this.prisma.submission.findFirst({
          where: { studentId: userId, assignment: { lessonId: dto.lessonId } },
        });
        if (!submission) {
          throw new BadRequestException('Bạn cần nộp bài tập trước khi hoàn thành bài học này');
        }
      }
    }

    const videoProgress = await this.prisma.videoProgress.upsert({
      where: { userId_lessonId: { userId, lessonId: dto.lessonId } },
      update: {
        ...(dto.watchTime !== undefined && { watchTime: dto.watchTime }),
        ...(dto.completed !== undefined && { completed: dto.completed }),
        watchedPercentage: maxPercentage,
      },
      create: {
        userId,
        lessonId: dto.lessonId,
        watchTime: dto.watchTime || 0,
        completed: dto.completed || false,
        watchedPercentage: maxPercentage,
      },
    });

    const totalLessons = await this.prisma.lesson.count({
      where: { section: { courseId } },
    });

    const completedLessons = await this.prisma.videoProgress.count({
      where: { userId, completed: true, lesson: { section: { courseId } } },
    });

    const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    await this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { progress },
    });

    return videoProgress;
  }

  /** Check if student can proceed: must watch 80% video AND submit assignments */
  async canCompleteLesson(userId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { assignments: { select: { id: true } } },
    });
    if (!lesson) return { canComplete: true, hasAssignment: false, videoWatched: true, watchedPercentage: 100 };

    // Check video progress
    let videoWatched = true;
    let watchedPercentage = 0;
    if (lesson.videoUrl) {
      const videoProgress = await this.prisma.videoProgress.findUnique({
        where: { userId_lessonId: { userId, lessonId } },
      });
      watchedPercentage = videoProgress?.watchedPercentage || 0;
      videoWatched = watchedPercentage >= 80;
    } else {
      watchedPercentage = 100;
      videoWatched = true;
    }

    // Check assignment submission
    const hasAssignment = lesson.assignments.length > 0;
    let assignmentSubmitted = true;
    if (hasAssignment) {
      const submission = await this.prisma.submission.findFirst({
        where: { studentId: userId, assignment: { lessonId } },
      });
      assignmentSubmitted = !!submission;
    }

    const canComplete = videoWatched && assignmentSubmitted;

    return {
      canComplete,
      hasAssignment,
      submitted: assignmentSubmitted,
      videoWatched,
      watchedPercentage: Math.round(watchedPercentage),
    };
  }


  async getVideoProgress(userId: string, lessonId: string) {
    return this.prisma.videoProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });
  }

  async getCourseVideosProgress(userId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { userId, courseId },
    });
    if (!enrollment) throw new NotFoundException('User is not enrolled in this course');

    const lessons = await this.prisma.lesson.findMany({
      where: { section: { courseId } },
      orderBy: { order: 'asc' },
    });

    const videoProgress = await this.prisma.videoProgress.findMany({
      where: {
        userId,
        lesson: { section: { courseId } },
      },
    });

    const lessonsWithProgress = lessons.map(lesson => {
      const progress = videoProgress.find(p => p.lessonId === lesson.id) || {
        completed: false,
        watchTime: 0,
        watchedPercentage: 0,
      };
      return {
        ...lesson,
        completed: progress.completed,
        watchTime: progress.watchTime,
        watchedPercentage: progress.watchedPercentage,
      };
    });

    return { overallProgress: enrollment.progress, lessons: lessonsWithProgress };
  }
}
