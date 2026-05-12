import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProgressRepository } from '../database/repositories';
import { AppEvents } from '../shared/events';
import {
  LessonCompletedPayload,
  ProgressUpdatedPayload,
  CourseCompletedPayload,
} from '../shared/events';
import { UpdateVideoProgressDto } from './dto/update-video-progress.dto';

@Injectable()
export class ProgressService {
  constructor(
    private readonly progressRepo: ProgressRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getUserProgress(userId: string, courseId: string) {
    const enrollment = await this.progressRepo.findEnrollment(userId, courseId);
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    const totalLessons = await this.progressRepo.countLessonsByCourse(courseId);
    const completedLessons = await this.progressRepo.countCompletedLessons(userId, courseId);

    return {
      courseId,
      enrollmentId: enrollment.id,
      progress: enrollment.progress,
      totalLessons,
      completedLessons,
    };
  }

  async updateProgress(userId: string, courseId: string, progress: number) {
    const enrollment = await this.progressRepo.findEnrollment(userId, courseId);
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    const updated = await this.progressRepo.updateEnrollmentProgress(enrollment.id, progress);

    // Emit progress updated event
    this.eventEmitter.emit(AppEvents.PROGRESS_UPDATED, {
      userId,
      courseId,
      progress,
    } as ProgressUpdatedPayload);

    if (progress >= 100) {
      this.eventEmitter.emit(AppEvents.COURSE_COMPLETED, {
        userId,
        courseId,
        courseTitle: '', // minimal payload — listener can enrich if needed
      } as CourseCompletedPayload);
    }

    return updated;
  }

  async getCoursesProgress(userId: string) {
    const enrollments = await this.progressRepo.findEnrollmentsWithCourse(userId);
    const results = [];

    for (const enrollment of enrollments) {
      const totalLessons = await this.progressRepo.countLessonsByCourse(enrollment.courseId);
      const completedLessons = await this.progressRepo.countCompletedLessons(
        userId,
        enrollment.courseId,
      );

      results.push({
        courseId: enrollment.courseId,
        courseTitle: enrollment.course?.title,
        enrollmentId: enrollment.id,
        progress: enrollment.progress,
        totalLessons,
        completedLessons,
      });
    }

    return results;
  }

  async getCourseVideosProgress(userId: string, courseId: string) {
    return this.progressRepo.findVideoProgressByCourse(userId, courseId);
  }

  async getVideoProgress(userId: string, lessonId: string) {
    const progress = await this.progressRepo.findVideoProgress(userId, lessonId);
    return progress || { watchTime: 0, completed: false, watchedPercentage: 0 };
  }

  async updateVideoProgress(userId: string, dto: UpdateVideoProgressDto) {
    const lesson = await this.progressRepo.findLessonWithDetails(dto.lessonId);
    if (!lesson) throw new NotFoundException('Lesson not found');

    const courseId = lesson.section?.courseId;
    if (!courseId) throw new BadRequestException('Lesson is not part of a course');

    const enrollment = await this.progressRepo.findEnrollment(userId, courseId);
    if (!enrollment) throw new NotFoundException('Enrollment not found for this course');

    const result = await this.progressRepo.upsertVideoProgress({
      userId,
      lessonId: dto.lessonId,
      watchTime: dto.watchTime,
      completed: dto.completed,
      watchedPercentage: dto.watchedPercentage,
    });

    // Auto-update enrollment progress when video is completed
    if (dto.completed) {
      const totalLessons = await this.progressRepo.countLessonsByCourse(courseId);
      const completedLessons = await this.progressRepo.countCompletedLessons(userId, courseId);
      const newProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      await this.progressRepo.updateEnrollmentProgress(enrollment.id, newProgress);

      this.eventEmitter.emit(AppEvents.LESSON_COMPLETED, {
        userId,
        lessonId: dto.lessonId,
        courseId,
      } as LessonCompletedPayload);

      this.eventEmitter.emit(AppEvents.PROGRESS_UPDATED, {
        userId,
        courseId,
        progress: newProgress,
      } as ProgressUpdatedPayload);

      if (newProgress >= 100) {
        this.eventEmitter.emit(AppEvents.COURSE_COMPLETED, {
          userId,
          courseId,
          courseTitle: '',
        } as CourseCompletedPayload);
      }
    }

    return result;
  }

  async canCompleteLesson(userId: string, lessonId: string) {
    const lesson = await this.progressRepo.findLessonWithAssignments(lessonId);
    if (!lesson) throw new NotFoundException('Lesson not found');

    const videoProgress = await this.progressRepo.findVideoProgress(userId, lessonId);
    const videoCompleted = videoProgress?.completed ?? false;

    let assignmentsCompleted = true;
    if (lesson.assignments && lesson.assignments.length > 0) {
      const submission = await this.progressRepo.findSubmissionForLesson(userId, lessonId);
      assignmentsCompleted = !!submission;
    }

    return { canComplete: videoCompleted && assignmentsCompleted, videoCompleted, assignmentsCompleted };
  }
}
