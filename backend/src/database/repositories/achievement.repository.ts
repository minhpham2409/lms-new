import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Repository for badge/achievement and gamification queries.
 * Encapsulates the multi-entity aggregate counts needed for badge progress calculation.
 */
@Injectable()
export class AchievementRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Upsert a badge definition */
  upsertBadge(def: { code: string; name: string; icon: string; category: string; tier: string; requirement: number; description: string }) {
    return this.prisma.badge.upsert({
      where: { code: def.code },
      create: def,
      update: { name: def.name, description: def.description, icon: def.icon, tier: def.tier, requirement: def.requirement },
    });
  }

  countBadges() {
    return this.prisma.badge.count();
  }

  /** Get user badges with badge details */
  getUserBadges(userId: string) {
    return this.prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });
  }

  /** Get all badge definitions */
  getAllBadges() {
    return this.prisma.badge.findMany({ orderBy: [{ category: 'asc' }, { requirement: 'asc' }] });
  }

  async getUserStats(userId: string) {
    const [streak, completedCourses, quizAttempts, videosWatched, assignmentsSub, commentsCount, enrollments] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { currentStreak: true } }),
      this.prisma.enrollment.count({ where: { userId, progress: { gte: 100 } } }),
      this.prisma.quizAttempt.count({ where: { studentId: userId } }),
      this.prisma.videoProgress.count({ where: { userId, completed: true } }),
      this.prisma.submission.count({ where: { studentId: userId } }),
      this.prisma.comment.count({ where: { userId } }),
      this.prisma.enrollment.count({ where: { userId } }),
    ]);

    return {
      streak: streak?.currentStreak || 0,
      completedCourses,
      quizAttempts,
      videosWatched,
      assignmentsSub,
      commentsCount,
      enrollments,
    };
  }

  /** Award a badge to a user */
  awardBadge(userId: string, badgeId: string) {
    return this.prisma.userBadge.create({ data: { userId, badgeId } });
  }

  /** Get existing user badge IDs */
  async getExistingBadgeIds(userId: string) {
    const badges = await this.prisma.userBadge.findMany({
      where: { userId },
      select: { badgeId: true },
    });
    return new Set(badges.map(b => b.badgeId));
  }

  /** Get leaderboard data: students with badges */
  getLeaderboardStudents() {
    return this.prisma.user.findMany({
      where: { role: 'student' },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        currentStreak: true,
        badges: {
          include: { badge: true },
          orderBy: { earnedAt: 'desc' },
        },
      },
      orderBy: { currentStreak: 'desc' },
    });
  }

  /** Get user public profile data */
  getUserPublicProfileData(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        currentStreak: true,
        createdAt: true,
      },
    });
  }

  /** Get public profile counts */
  async getPublicProfileCounts(userId: string) {
    const [completedCourses, enrollments] = await Promise.all([
      this.prisma.enrollment.count({ where: { userId, progress: { gte: 100 } } }),
      this.prisma.enrollment.count({ where: { userId } }),
    ]);
    return { completedCourses, enrollments };
  }
}
