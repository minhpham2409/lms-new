import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const XP_VALUES = {
  videoWatched: 5,
  quizDone: 10,
  assignmentDone: 8,
  checkInDay: 3,
  badgeEarned: 20,
  courseCompleted: 50,
  certificateEarned: 30,
};

@Injectable()
export class MonthlyRaceService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  private getMonthRange(month: number, year: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    return { start, end };
  }

  async getUserMonthlyStats(userId: string, month: number, year: number) {
    const { start, end } = this.getMonthRange(month, year);

    const [
      videosWatched,
      quizzesDone,
      assignmentsDone,
      badgesEarned,
      coursesCompleted,
      certificatesEarned,
      watchTimeData,
    ] = await Promise.all([
      this.prisma.videoProgress.count({
        where: { userId, completed: true, updatedAt: { gte: start, lt: end } },
      }),
      this.prisma.quizAttempt.count({
        where: { studentId: userId, createdAt: { gte: start, lt: end } },
      }),
      this.prisma.submission.count({
        where: { studentId: userId, createdAt: { gte: start, lt: end } },
      }),
      this.prisma.userBadge.count({
        where: { userId, earnedAt: { gte: start, lt: end } },
      }),
      this.prisma.enrollment.count({
        where: { userId, progress: { gte: 100 }, updatedAt: { gte: start, lt: end } },
      }),
      this.prisma.certificate.count({
        where: { userId, createdAt: { gte: start, lt: end } },
      }),
      this.prisma.videoProgress.aggregate({
        where: { userId, updatedAt: { gte: start, lt: end } },
        _sum: { watchTime: true },
      }),
    ]);

    const activities = await this.prisma.videoProgress.findMany({
      where: { userId, updatedAt: { gte: start, lt: end } },
      select: { updatedAt: true },
    });
    const activityDates = new Set(
      activities.map(a => a.updatedAt.toISOString().slice(0, 10)),
    );
    const quizDates = await this.prisma.quizAttempt.findMany({
      where: { studentId: userId, createdAt: { gte: start, lt: end } },
      select: { createdAt: true },
    });
    quizDates.forEach(q => activityDates.add(q.createdAt.toISOString().slice(0, 10)));
    const subDates = await this.prisma.submission.findMany({
      where: { studentId: userId, createdAt: { gte: start, lt: end } },
      select: { createdAt: true },
    });
    subDates.forEach(s => activityDates.add(s.createdAt.toISOString().slice(0, 10)));

    const checkInDays = activityDates.size;
    const watchMinutes = Math.round((watchTimeData._sum.watchTime || 0) / 60);

    const xp =
      videosWatched * XP_VALUES.videoWatched +
      quizzesDone * XP_VALUES.quizDone +
      assignmentsDone * XP_VALUES.assignmentDone +
      checkInDays * XP_VALUES.checkInDay +
      badgesEarned * XP_VALUES.badgeEarned +
      coursesCompleted * XP_VALUES.courseCompleted +
      certificatesEarned * XP_VALUES.certificateEarned;

    return {
      userId,
      month,
      year,
      stats: {
        videosWatched,
        quizzesDone,
        assignmentsDone,
        checkInDays,
        badgesEarned,
        coursesCompleted,
        certificatesEarned,
        watchMinutes,
      },
      rawXP: xp,
      multiplier: 1,
      xp,
    };
  }

  async getMonthlyLeaderboard(month: number, year: number) {
    const students = await this.prisma.user.findMany({
      where: { role: 'student' },
      select: { id: true, username: true, firstName: true, lastName: true, currentStreak: true },
    });

    const results = await Promise.all(
      students.map(async (student) => {
        const data = await this.getUserMonthlyStats(student.id, month, year);
        return {
          userId: student.id,
          name: student.firstName || student.username,
          streak: student.currentStreak,
          ...data.stats,
          rawXP: data.xp,
          multiplier: 1,
          xp: data.xp,
        };
      }),
    );

    return results
      .filter(r => r.xp > 0)
      .sort((a, b) => b.xp - a.xp);
  }

  async finalizeMonth(month: number, year: number) {
    const existing = await this.prisma.monthlyWinner.findFirst({
      where: { month, year },
    });
    if (existing) {
      return { message: `Tháng ${month}/${year} đã được tổng kết rồi.`, winners: [] };
    }

    const leaderboard = await this.getMonthlyLeaderboard(month, year);
    if (leaderboard.length === 0) {
      return { message: 'Không có dữ liệu cho tháng này.', winners: [] };
    }

    const rewards = [
      { rank: 1, discount: 20 },
      { rank: 2, discount: 10 },
      { rank: 3, discount: 5 },
    ];

    const winners = [];

    for (const reward of rewards) {
      const entry = leaderboard[reward.rank - 1];
      if (!entry) continue;

      const code = `MONTHLY${month}${year}-TOP${reward.rank}-${entry.userId.substring(0, 4).toUpperCase()}${Math.floor(Math.random() * 9000 + 1000)}`;

      await this.prisma.coupon.create({
        data: {
          code,
          discount: reward.discount,
          maxUses: 1,
          isActive: true,
          type: 'streak',
          userId: entry.userId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      await this.prisma.monthlyWinner.create({
        data: {
          userId: entry.userId,
          month,
          year,
          rank: reward.rank,
          xp: entry.xp,
          discount: reward.discount,
          couponCode: code,
        },
      });

      this.notificationsService.notifyUser(entry.userId, {
        title: `🏆 Chúc mừng Hạng ${reward.rank} tháng ${month}/${year}!`,
        message: `Bạn đạt hạng ${reward.rank} với ${entry.xp} XP! Mã giảm giá ${reward.discount}%: ${code}`,
        type: 'reward',
      });

      winners.push({ ...entry, rank: reward.rank, discount: reward.discount, couponCode: code });
    }

    return { message: `Đã tổng kết tháng ${month}/${year}`, winners };
  }

  async getHistory(limit = 12) {
    const winners = await this.prisma.monthlyWinner.findMany({
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { rank: 'asc' }],
      take: limit * 3,
      include: {
        user: { select: { id: true, username: true, firstName: true, lastName: true } },
      },
    });

    const grouped: Record<string, any[]> = {};
    for (const w of winners) {
      const key = `${w.year}-${String(w.month).padStart(2, '0')}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({
        rank: w.rank,
        name: w.user.firstName || w.user.username,
        xp: w.xp,
        discount: w.discount,
        couponCode: w.couponCode,
      });
    }

    return Object.entries(grouped).map(([key, winners]) => ({
      period: key,
      month: parseInt(key.split('-')[1]),
      year: parseInt(key.split('-')[0]),
      winners,
    }));
  }

  getXPConfig() {
    return XP_VALUES;
  }
}
