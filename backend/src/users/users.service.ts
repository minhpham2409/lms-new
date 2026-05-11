import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { AchievementsService } from '../achievements/achievements.service';

// Reward tiers with milestone-based rewards
const STREAK_REWARDS = [
  { days: 14,  discount: 10, label: '2 tuần liên tiếp' },
  { days: 30,  discount: 15, label: '1 tháng liên tiếp' },
  { days: 60,  discount: 25, label: '2 tháng liên tiếp' },
  { days: 100, discount: 35, label: '100 ngày liên tiếp' },
  { days: 180, discount: 50, label: '6 tháng liên tiếp' },
];

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private achievementsService: AchievementsService,
  ) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });
  }

  async findPublicTeachers() {
    const teachers = await this.prisma.user.findMany({
      where: { role: 'teacher' },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true, // We can optionally return email, but maybe limit what is public
        // Fetch course count
        _count: {
          select: {
            courses: true
          }
        }
      },
    });

    return teachers;
  }

  async findPublicTeacherById(id: string) {
    return this.prisma.user.findUnique({
      where: { id, role: 'teacher' },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        bio: true,
        createdAt: true,
        courses: {
          where: { status: 'published' },
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            thumbnail: true,
            _count: {
              select: { enrollments: true }
            },
            sections: {
              select: {
                _count: {
                  select: { lessons: true }
                }
              }
            }
          }
        }
      }
    });
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async getStudentDashboard(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { currentStreak: true, lastActivityDate: true },
    });

    // Gather activities from multiple real sources
    const activities: Array<{ text: string; time: Date; type: string }> = [];

    // 1. Completed lessons (VideoProgress)
    const recentVideos = await this.prisma.videoProgress.findMany({
      where: { userId, completed: true },
      include: { lesson: { select: { title: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 3,
    });
    for (const v of recentVideos) {
      activities.push({ text: `Hoàn thành bài: ${v.lesson.title}`, time: v.updatedAt, type: 'lesson' });
    }

    // 2. Quiz attempts
    const recentQuizzes = await this.prisma.quizAttempt.findMany({
      where: { studentId: userId },
      include: { quiz: { include: { assignment: { select: { title: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });
    for (const q of recentQuizzes) {
      const name = q.quiz?.assignment?.title || 'Quiz';
      activities.push({ text: `Đạt ${q.score}/${q.maxScore} — ${name}`, time: q.createdAt, type: 'quiz' });
    }

    // 3. Assignment submissions
    const recentSubmissions = await this.prisma.submission.findMany({
      where: { studentId: userId },
      include: { assignment: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });
    for (const s of recentSubmissions) {
      activities.push({ text: `Nộp bài: ${s.assignment.title}`, time: s.createdAt, type: 'submission' });
    }

    // 4. Enrollments
    const recentEnrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      include: { course: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
      take: 2,
    });
    for (const e of recentEnrollments) {
      activities.push({ text: `Đăng ký khóa: ${e.course.title}`, time: e.createdAt, type: 'enrollment' });
    }

    // 5. Certificates
    const recentCerts = await this.prisma.certificate.findMany({
      where: { userId },
      include: { course: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
      take: 2,
    });
    for (const c of recentCerts) {
      activities.push({ text: `Nhận chứng chỉ: ${c.course.title}`, time: c.createdAt, type: 'certificate' });
    }

    // Sort by time desc, take top 6
    activities.sort((a, b) => b.time.getTime() - a.time.getTime());

    // Calculate next reward milestone
    const currentStreak = user?.currentStreak || 0;
    const nextReward = STREAK_REWARDS.find(r => r.days > currentStreak) || null;

    return {
      streak: currentStreak,
      nextReward: nextReward ? { days: nextReward.days, discount: nextReward.discount, remaining: nextReward.days - currentStreak } : null,
      activities: activities.slice(0, 6).map(a => ({
        text: a.text,
        time: a.time,
        type: a.type,
      })),
    };
  }

  async checkInStreak(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    const now = new Date();
    const lastDate = user.lastActivityDate;
    let newStreak = user.currentStreak;

    if (!lastDate) {
      newStreak = 1;
    } else {
      const msPerDay = 1000 * 60 * 60 * 24;
      const last = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const diffDays = Math.floor((today.getTime() - last.getTime()) / msPerDay);

      if (diffDays === 0) {
        // Already checked in today — still return reward info
        const nextReward = STREAK_REWARDS.find(r => r.days > newStreak) || null;
        const activeCoupon = await this.prisma.coupon.findFirst({
          where: { userId, type: 'streak', isActive: true },
          orderBy: { discount: 'desc' },
        });
        return { streak: newStreak, rewarded: false, reward: null, nextReward, activeCoupon };
      } else if (diffDays === 1) {
        newStreak += 1;
      } else {
        newStreak = 1; // streak broken
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { currentStreak: newStreak, lastActivityDate: now },
    });

    let reward = null;
    const milestone = STREAK_REWARDS.find(r => r.days === newStreak);

    if (milestone) {
      // Deactivate ALL previous streak coupons for this user (single active coupon rule)
      await this.prisma.coupon.updateMany({
        where: { userId, type: 'streak', isActive: true },
        data: { isActive: false },
      });

      const code = `STREAK${milestone.days}-${userId.substring(0, 4).toUpperCase()}${Math.floor(Math.random() * 9000 + 1000)}`;
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);

      await this.prisma.coupon.create({
        data: {
          code,
          discount: milestone.discount,
          maxUses: 1,
          expiresAt: expiry,
          isActive: true,
          type: 'streak',
          userId,
        },
      });

      this.notificationsService.notifyUser(userId, {
        title: `Phần thưởng ${milestone.label}!`,
        message: `Bạn nhận mã giảm giá ${milestone.discount}%: ${code}. Mã cá nhân, có hiệu lực 30 ngày.`,
        type: 'reward',
      });

      reward = { code, discount: milestone.discount, label: milestone.label };
    }

    const nextReward = STREAK_REWARDS.find(r => r.days > newStreak) || null;
    const activeCoupon = await this.prisma.coupon.findFirst({
      where: { userId, type: 'streak', isActive: true },
      orderBy: { discount: 'desc' },
    });

    // Auto-award badges based on new stats
    try { await this.achievementsService.checkAndAwardBadges(userId); } catch {}

    return {
      streak: newStreak,
      rewarded: !!reward,
      reward,
      nextReward: nextReward ? { days: nextReward.days, discount: nextReward.discount, remaining: nextReward.days - newStreak } : null,
      activeCoupon,
    };
  }

  async getMyStreakCoupon(userId: string) {
    const coupon = await this.prisma.coupon.findFirst({
      where: {
        userId,
        type: 'streak',
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: { discount: 'desc' },
    });

    if (!coupon) return null;

    // Check if already fully used
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return null;
    }

    return coupon;
  }
}

