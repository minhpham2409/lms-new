import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppEvents } from '../shared/events';
import {
  ProgressUpdatedPayload,
  LessonCompletedPayload,
  EnrollmentCreatedPayload,
  QuizSubmittedPayload,
  CommentCreatedPayload,
} from '../shared/events';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Listens to progress/activity events and checks if user qualifies for new badges.
 * This replaces the need for Achievements to be called directly from other modules.
 */
@Injectable()
export class AchievementEventListener {
  private readonly logger = new Logger(AchievementEventListener.name);

  constructor(private readonly prisma: PrismaService) {}

  @OnEvent(AppEvents.LESSON_COMPLETED)
  @OnEvent(AppEvents.PROGRESS_UPDATED)
  @OnEvent(AppEvents.ENROLLMENT_CREATED)
  @OnEvent(AppEvents.QUIZ_SUBMITTED)
  @OnEvent(AppEvents.COMMENT_CREATED)
  @OnEvent(AppEvents.STREAK_UPDATED)
  async onActivityEvent(
    payload:
      | ProgressUpdatedPayload
      | LessonCompletedPayload
      | EnrollmentCreatedPayload
      | QuizSubmittedPayload
      | CommentCreatedPayload
      | { userId: string },
  ) {
    const userId = payload.userId;
    if (!userId) return;

    try {
      await this.checkAndAwardBadges(userId);
    } catch (err) {
      this.logger.warn(`Badge check failed for user ${userId}: ${err.message}`);
    }
  }

  /**
   * Core badge awarding logic — runs after any activity event.
   * Kept lightweight: only awards badges, does not compute full stats.
   */
  private async checkAndAwardBadges(userId: string) {
    const [
      streak,
      completedCourses,
      quizAttempts,
      videosWatched,
      assignmentsSub,
      commentsCount,
      enrollments,
    ] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { currentStreak: true } }),
      this.prisma.enrollment.count({ where: { userId, progress: { gte: 100 } } }),
      this.prisma.quizAttempt.count({ where: { studentId: userId } }),
      this.prisma.videoProgress.count({ where: { userId, completed: true } }),
      this.prisma.submission.count({ where: { studentId: userId } }),
      this.prisma.comment.count({ where: { userId } }),
      this.prisma.enrollment.count({ where: { userId } }),
    ]);

    const allBadges = await this.prisma.badge.findMany();
    const existingBadges = await this.prisma.userBadge.findMany({
      where: { userId },
      select: { badgeId: true },
    });
    const existingIds = new Set(existingBadges.map((b) => b.badgeId));

    for (const badge of allBadges) {
      if (existingIds.has(badge.id)) continue;

      let current = 0;
      if (badge.category === 'streak') current = streak?.currentStreak || 0;
      else if (badge.category === 'course') current = completedCourses;
      else if (badge.category === 'quiz') current = quizAttempts;
      else if (badge.category === 'video') current = videosWatched;
      else if (badge.category === 'assignment') current = assignmentsSub;
      else if (badge.category === 'social') current = commentsCount;
      else if (badge.category === 'enrollment') current = enrollments;

      if (current >= badge.requirement) {
        await this.prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
        this.logger.log(`Badge "${badge.code}" awarded to user ${userId}`);
      }
    }
  }
}
