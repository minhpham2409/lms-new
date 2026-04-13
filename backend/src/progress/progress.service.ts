import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateVideoProgressDto } from './dto/update-video-progress.dto';

@Injectable()
export default class ProgressService {
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
      include: { section: true },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    const courseId = lesson.section.courseId;

    const enrollment = await this.prisma.enrollment.findFirst({
      where: { userId, courseId },
    });
    if (!enrollment) throw new NotFoundException('User is not enrolled in this course');

    const videoProgress = await this.prisma.videoProgress.upsert({
      where: { userId_lessonId: { userId, lessonId: dto.lessonId } },
      update: {
        ...(dto.watchTime !== undefined && { watchTime: dto.watchTime }),
        ...(dto.completed !== undefined && { completed: dto.completed }),
      },
      create: {
        userId,
        lessonId: dto.lessonId,
        watchTime: dto.watchTime || 0,
        completed: dto.completed || false,
      },
    });

    const totalLessons = await this.prisma.lesson.count({
      where: { section: { courseId } },
    });

    const completedLessons = await this.prisma.videoProgress.count({
      where: {
        userId,
        completed: true,
        lesson: { section: { courseId } },
      },
    });

    const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    await this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { progress },
    });

    return videoProgress;
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
      };
      return { ...lesson, completed: progress.completed, watchTime: progress.watchTime };
    });

    return { overallProgress: enrollment.progress, lessons: lessonsWithProgress };
  }
}
