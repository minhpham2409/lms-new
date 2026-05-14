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

/** Minimum watched percentage to auto-mark lesson as completed. */
const COMPLETION_THRESHOLD = 90;

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

  /**
   * Update course progress — derived from server-side lesson completion data only.
   * Client cannot arbitrarily set progress percentage.
   */
  async recalculateCourseProgress(userId: string, courseId: string) {
    const enrollment = await this.progressRepo.findEnrollment(userId, courseId);
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    const totalLessons = await this.progressRepo.countLessonsByCourse(courseId);
    const completedLessons = await this.progressRepo.countCompletedLessons(userId, courseId);
    const newProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    const updated = await this.progressRepo.updateEnrollmentProgress(enrollment.id, newProgress);

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

    return updated;
  }

  /**
   * Legacy endpoint — now delegates to recalculateCourseProgress.
   * Client-sent progress value is IGNORED; progress is always derived server-side.
   */
  async updateProgress(userId: string, courseId: string, _progress: number) {
    return this.recalculateCourseProgress(userId, courseId);
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

  /**
   * Update video progress for a lesson.
   * Server decides completion — client's `completed` flag is overridden
   * by server-side threshold check (watchedPercentage >= 90%).
   */
  async updateVideoProgress(userId: string, dto: UpdateVideoProgressDto) {
    const lesson = await this.progressRepo.findLessonWithDetails(dto.lessonId);
    if (!lesson) throw new NotFoundException('Lesson not found');

    const courseId = lesson.section?.courseId;
    if (!courseId) throw new BadRequestException('Lesson is not part of a course');

    const enrollment = await this.progressRepo.findEnrollment(userId, courseId);
    if (!enrollment) throw new NotFoundException('Enrollment not found for this course');

    // ── Server-side completion decision ──────────────────────────────────
    // Clamp percentage to [0, 100] (DTO already validates, but be safe)
    const pct = Math.min(100, Math.max(0, dto.watchedPercentage ?? 0));
    const watchTime = Math.max(0, dto.watchTime ?? 0);

    // Server decides: completed only if watched >= COMPLETION_THRESHOLD%
    const serverCompleted = pct >= COMPLETION_THRESHOLD;

    const result = await this.progressRepo.upsertVideoProgress({
      userId,
      lessonId: dto.lessonId,
      watchTime,
      completed: serverCompleted,
      watchedPercentage: pct,
    });

    // Auto-update enrollment progress when video is completed
    if (serverCompleted) {
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

  /**
   * Check if a lesson can be marked as completed.
   * Video must be watched to threshold, and assignments (if any) must be graded.
   */
  async canCompleteLesson(userId: string, lessonId: string) {
    const lesson = await this.progressRepo.findLessonWithAssignments(lessonId);
    if (!lesson) throw new NotFoundException('Lesson not found');

    const videoProgress = await this.progressRepo.findVideoProgress(userId, lessonId);
    const videoCompleted = videoProgress?.completed ?? false;

    let assignmentsCompleted = true;
    if (lesson.assignments && lesson.assignments.length > 0) {
      // For assignments: submission must exist (even if pending)
      for (const assignment of lesson.assignments) {
        const submission = await this.progressRepo.findSubmissionForAssignment(userId, assignment.id);
        if (!submission) {
          assignmentsCompleted = false;
          break;
        }
      }
    }

    return { canComplete: videoCompleted && assignmentsCompleted, videoCompleted, assignmentsCompleted };
  }
}
