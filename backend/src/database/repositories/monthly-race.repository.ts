import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Repository for monthly race XP calculation and leaderboard queries.
 */
@Injectable()
export class MonthlyRaceRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Count completed videos in a date range */
  countCompletedVideos(userId: string, start: Date, end: Date) {
    return this.prisma.videoProgress.count({
      where: { userId, completed: true, updatedAt: { gte: start, lt: end } },
    });
  }

  /** Count quiz attempts in a date range */
  countQuizAttempts(userId: string, start: Date, end: Date) {
    return this.prisma.quizAttempt.count({
      where: { studentId: userId, createdAt: { gte: start, lt: end } },
    });
  }

  /** Count submissions in a date range */
  countSubmissions(userId: string, start: Date, end: Date) {
    return this.prisma.submission.count({
      where: { studentId: userId, createdAt: { gte: start, lt: end } },
    });
  }

  /** Count badges earned in a date range */
  countBadgesEarned(userId: string, start: Date, end: Date) {
    return this.prisma.userBadge.count({
      where: { userId, earnedAt: { gte: start, lt: end } },
    });
  }

  /** Count courses completed in a date range */
  countCoursesCompleted(userId: string, start: Date, end: Date) {
    return this.prisma.enrollment.count({
      where: { userId, progress: { gte: 100 }, updatedAt: { gte: start, lt: end } },
    });
  }

  /** Count certificates earned in a date range */
  countCertificates(userId: string, start: Date, end: Date) {
    return this.prisma.certificate.count({
      where: { userId, createdAt: { gte: start, lt: end } },
    });
  }

  /** Aggregate watch time in a date range */
  aggregateWatchTime(userId: string, start: Date, end: Date) {
    return this.prisma.videoProgress.aggregate({
      where: { userId, updatedAt: { gte: start, lt: end } },
      _sum: { watchTime: true },
    });
  }

  /** Get activity dates for check-in day counting */
  async getActivityDates(userId: string, start: Date, end: Date) {
    const [videos, quizzes, submissions] = await Promise.all([
      this.prisma.videoProgress.findMany({
        where: { userId, updatedAt: { gte: start, lt: end } },
        select: { updatedAt: true },
      }),
      this.prisma.quizAttempt.findMany({
        where: { studentId: userId, createdAt: { gte: start, lt: end } },
        select: { createdAt: true },
      }),
      this.prisma.submission.findMany({
        where: { studentId: userId, createdAt: { gte: start, lt: end } },
        select: { createdAt: true },
      }),
    ]);

    const dates = new Set<string>();
    videos.forEach(v => dates.add(v.updatedAt.toISOString().slice(0, 10)));
    quizzes.forEach(q => dates.add(q.createdAt.toISOString().slice(0, 10)));
    submissions.forEach(s => dates.add(s.createdAt.toISOString().slice(0, 10)));

    return dates;
  }

  /** Get all students for leaderboard */
  getAllStudents() {
    return this.prisma.user.findMany({
      where: { role: 'student' },
      select: { id: true, username: true, firstName: true, lastName: true, currentStreak: true },
    });
  }

  /** Find existing monthly winner */
  findMonthlyWinner(month: number, year: number) {
    return this.prisma.monthlyWinner.findFirst({ where: { month, year } });
  }

  /** Create a coupon */
  createCoupon(data: {
    code: string;
    discount: number;
    maxUses: number;
    isActive: boolean;
    type: string;
    userId: string;
    expiresAt: Date;
  }) {
    return this.prisma.coupon.create({ data });
  }

  /** Create monthly winner record */
  createMonthlyWinner(data: {
    userId: string;
    month: number;
    year: number;
    rank: number;
    xp: number;
    discount: number;
    couponCode: string;
  }) {
    return this.prisma.monthlyWinner.create({ data });
  }

  /** Get winner history */
  getWinnerHistory(take: number) {
    return this.prisma.monthlyWinner.findMany({
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { rank: 'asc' }],
      take,
      include: {
        user: { select: { id: true, username: true, firstName: true, lastName: true } },
      },
    });
  }
}
