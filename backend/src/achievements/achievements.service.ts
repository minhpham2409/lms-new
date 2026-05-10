import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// All available badges in the system
const BADGE_DEFINITIONS = [
  // Streak badges
  { code: 'streak_3',   name: 'Ngọn lửa nhỏ',        icon: '🔥', category: 'streak', tier: 'bronze',   requirement: 3,   description: 'Học 3 ngày liên tiếp' },
  { code: 'streak_7',   name: 'Chiến binh tuần',      icon: '⚡', category: 'streak', tier: 'silver',   requirement: 7,   description: 'Học 7 ngày liên tiếp' },
  { code: 'streak_14',  name: 'Kiên trì',             icon: '💪', category: 'streak', tier: 'gold',     requirement: 14,  description: 'Học 14 ngày liên tiếp' },
  { code: 'streak_30',  name: 'Bền bỉ phi thường',    icon: '🏆', category: 'streak', tier: 'platinum', requirement: 30,  description: 'Học 30 ngày liên tiếp' },
  { code: 'streak_60',  name: 'Huyền thoại',          icon: '👑', category: 'streak', tier: 'diamond',  requirement: 60,  description: 'Học 60 ngày liên tiếp' },
  { code: 'streak_100', name: 'Bất khả chiến bại',    icon: '🌟', category: 'streak', tier: 'legendary',requirement: 100, description: 'Học 100 ngày liên tiếp' },

  // Course completion badges
  { code: 'course_1',   name: 'Khởi đầu',             icon: '📘', category: 'course', tier: 'bronze',   requirement: 1,   description: 'Hoàn thành 1 khóa học' },
  { code: 'course_3',   name: 'Học sinh chăm chỉ',    icon: '📚', category: 'course', tier: 'silver',   requirement: 3,   description: 'Hoàn thành 3 khóa học' },
  { code: 'course_5',   name: 'Nhà thông thái',       icon: '🎓', category: 'course', tier: 'gold',     requirement: 5,   description: 'Hoàn thành 5 khóa học' },
  { code: 'course_10',  name: 'Bậc thầy',             icon: '🏅', category: 'course', tier: 'platinum', requirement: 10,  description: 'Hoàn thành 10 khóa học' },
  { code: 'course_20',  name: 'Tiến sĩ',              icon: '🎖️', category: 'course', tier: 'diamond',  requirement: 20,  description: 'Hoàn thành 20 khóa học' },

  // Quiz badges
  { code: 'quiz_1',     name: 'Thử thách đầu',        icon: '✅', category: 'quiz', tier: 'bronze',   requirement: 1,   description: 'Hoàn thành 1 bài quiz' },
  { code: 'quiz_5',     name: 'Tay nhanh',             icon: '🧠', category: 'quiz', tier: 'silver',   requirement: 5,   description: 'Hoàn thành 5 bài quiz' },
  { code: 'quiz_10',    name: 'Bách chiến bách thắng', icon: '💎', category: 'quiz', tier: 'gold',     requirement: 10,  description: 'Hoàn thành 10 bài quiz' },
  { code: 'quiz_20',    name: 'Thần đồng',             icon: '🧩', category: 'quiz', tier: 'platinum', requirement: 20,  description: 'Hoàn thành 20 bài quiz' },

  // Certificate badges
  { code: 'cert_1',     name: 'Tốt nghiệp',           icon: '📜', category: 'certificate', tier: 'bronze',  requirement: 1,  description: 'Nhận chứng chỉ đầu tiên' },
  { code: 'cert_3',     name: 'Sưu tầm chứng chỉ',    icon: '🏛️', category: 'certificate', tier: 'silver',  requirement: 3,  description: 'Nhận 3 chứng chỉ' },
  { code: 'cert_5',     name: 'Nhà sưu tập',           icon: '🗂️', category: 'certificate', tier: 'gold',    requirement: 5,  description: 'Nhận 5 chứng chỉ' },
  { code: 'cert_10',    name: 'Kho chứng chỉ',         icon: '🏆', category: 'certificate', tier: 'platinum',requirement: 10, description: 'Nhận 10 chứng chỉ' },
  { code: 'cert_20',    name: 'Huyền thoại chứng chỉ', icon: '👑', category: 'certificate', tier: 'diamond', requirement: 20, description: 'Nhận 20 chứng chỉ' },

  // Video watching badges
  { code: 'video_5',    name: 'Mắt sáng',             icon: '👀', category: 'video', tier: 'bronze',   requirement: 5,   description: 'Xem 5 video bài giảng' },
  { code: 'video_20',   name: 'Nghiện học',            icon: '📺', category: 'video', tier: 'silver',   requirement: 20,  description: 'Xem 20 video bài giảng' },
  { code: 'video_50',   name: 'Tín đồ video',         icon: '🎬', category: 'video', tier: 'gold',     requirement: 50,  description: 'Xem 50 video bài giảng' },
  { code: 'video_100',  name: 'Kỷ lục video',         icon: '🎥', category: 'video', tier: 'platinum', requirement: 100, description: 'Xem 100 video bài giảng' },

  // Assignment badges
  { code: 'assign_1',   name: 'Siêng năng',           icon: '✍️', category: 'assignment', tier: 'bronze',  requirement: 1,  description: 'Nộp 1 bài tập' },
  { code: 'assign_5',   name: 'Học trò gương mẫu',    icon: '📝', category: 'assignment', tier: 'silver',  requirement: 5,  description: 'Nộp 5 bài tập' },
  { code: 'assign_15',  name: 'Không bao giờ bỏ cuộc',icon: '🔖', category: 'assignment', tier: 'gold',    requirement: 15, description: 'Nộp 15 bài tập' },
  { code: 'assign_30',  name: 'Chiến binh bài tập',   icon: '📋', category: 'assignment', tier: 'platinum',requirement: 30, description: 'Nộp 30 bài tập' },
  { code: 'assign_50',  name: 'Vua bài tập',          icon: '🏅', category: 'assignment', tier: 'diamond', requirement: 50, description: 'Nộp 50 bài tập' },

  // Social / Engagement badges
  { code: 'comment_1',  name: 'Hòa đồng',             icon: '💬', category: 'social', tier: 'bronze',  requirement: 1,  description: 'Bình luận bài giảng đầu tiên' },
  { code: 'comment_10', name: 'Người giao lưu',        icon: '🗣️', category: 'social', tier: 'silver',  requirement: 10, description: 'Bình luận 10 lần' },
  { code: 'comment_30', name: 'Ngôi sao cộng đồng',    icon: '⭐', category: 'social', tier: 'gold',    requirement: 30, description: 'Bình luận 30 lần' },
  { code: 'comment_50', name: 'Trưởng nhóm',           icon: '🎙️', category: 'social', tier: 'platinum',requirement: 50, description: 'Bình luận 50 lần' },

  // Enrollment badges
  { code: 'enroll_1',   name: 'Tò mò',                icon: '🔍', category: 'enrollment', tier: 'bronze',  requirement: 1,  description: 'Đăng ký khóa học đầu tiên' },
  { code: 'enroll_3',   name: 'Khám phá',             icon: '🧭', category: 'enrollment', tier: 'silver',  requirement: 3,  description: 'Đăng ký 3 khóa học' },
  { code: 'enroll_5',   name: 'Đam mê học hỏi',       icon: '🌈', category: 'enrollment', tier: 'gold',    requirement: 5,  description: 'Đăng ký 5 khóa học' },
  { code: 'enroll_10',  name: 'Nghiện học tập',        icon: '🚀', category: 'enrollment', tier: 'platinum',requirement: 10, description: 'Đăng ký 10 khóa học' },
  { code: 'enroll_15',  name: 'Bách khoa toàn thư',    icon: '📖', category: 'enrollment', tier: 'diamond', requirement: 15, description: 'Đăng ký 15 khóa học' },
];

@Injectable()
export class AchievementsService {
  constructor(private prisma: PrismaService) {}

  async seedBadges() {
    for (const def of BADGE_DEFINITIONS) {
      await this.prisma.badge.upsert({
        where: { code: def.code },
        create: def,
        update: { name: def.name, description: def.description, icon: def.icon, tier: def.tier, requirement: def.requirement },
      });
    }
  }

  async getUserAchievements(userId: string) {
    // Get user badges
    const userBadges = await this.prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });

    // Get all badges
    const allBadges = await this.prisma.badge.findMany({ orderBy: [{ category: 'asc' }, { requirement: 'asc' }] });

    // Get user stats for progress
    const [streak, completedCourses, quizAttempts, certificates, videosWatched, assignmentsSub, commentsCount, enrollments] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { currentStreak: true } }),
      this.prisma.enrollment.count({ where: { userId, progress: { gte: 100 } } }),
      this.prisma.quizAttempt.count({ where: { studentId: userId } }),
      this.prisma.certificate.count({ where: { userId } }),
      this.prisma.videoProgress.count({ where: { userId, completed: true } }),
      this.prisma.submission.count({ where: { studentId: userId } }),
      this.prisma.comment.count({ where: { userId } }),
      this.prisma.enrollment.count({ where: { userId } }),
    ]);

    const earnedCodes = new Set(userBadges.map(ub => ub.badge.code));

    const badgesWithStatus = allBadges.map(badge => {
      const earned = earnedCodes.has(badge.code);
      const earnedAt = userBadges.find(ub => ub.badge.code === badge.code)?.earnedAt;
      let progress = 0;
      let current = 0;

      if (badge.category === 'streak') current = streak?.currentStreak || 0;
      else if (badge.category === 'course') current = completedCourses;
      else if (badge.category === 'quiz') current = quizAttempts;
      else if (badge.category === 'certificate') current = certificates;
      else if (badge.category === 'video') current = videosWatched;
      else if (badge.category === 'assignment') current = assignmentsSub;
      else if (badge.category === 'social') current = commentsCount;
      else if (badge.category === 'enrollment') current = enrollments;

      progress = Math.min(100, (current / badge.requirement) * 100);

      return { ...badge, earned, earnedAt, progress: Math.round(progress) };
    });

    return {
      badges: badgesWithStatus,
      stats: {
        total: allBadges.length,
        earned: userBadges.length,
        streak: streak?.currentStreak || 0,
        completedCourses,
        quizAttempts,
        certificates,
        videosWatched,
        assignmentsSub,
        commentsCount,
        enrollments,
      },
    };
  }

  async checkAndAwardBadges(userId: string) {
    const [streak, completedCourses, quizAttempts, certificates, videosWatched, assignmentsSub, commentsCount, enrollments] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { currentStreak: true } }),
      this.prisma.enrollment.count({ where: { userId, progress: { gte: 100 } } }),
      this.prisma.quizAttempt.count({ where: { studentId: userId } }),
      this.prisma.certificate.count({ where: { userId } }),
      this.prisma.videoProgress.count({ where: { userId, completed: true } }),
      this.prisma.submission.count({ where: { studentId: userId } }),
      this.prisma.comment.count({ where: { userId } }),
      this.prisma.enrollment.count({ where: { userId } }),
    ]);

    const allBadges = await this.prisma.badge.findMany();
    const existingBadges = await this.prisma.userBadge.findMany({ where: { userId }, select: { badgeId: true } });
    const existingIds = new Set(existingBadges.map(b => b.badgeId));

    const newBadges: string[] = [];

    for (const badge of allBadges) {
      if (existingIds.has(badge.id)) continue;

      let current = 0;
      if (badge.category === 'streak') current = streak?.currentStreak || 0;
      else if (badge.category === 'course') current = completedCourses;
      else if (badge.category === 'quiz') current = quizAttempts;
      else if (badge.category === 'certificate') current = certificates;
      else if (badge.category === 'video') current = videosWatched;
      else if (badge.category === 'assignment') current = assignmentsSub;
      else if (badge.category === 'social') current = commentsCount;
      else if (badge.category === 'enrollment') current = enrollments;

      if (current >= badge.requirement) {
        await this.prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
        newBadges.push(badge.code);
      }
    }

    return newBadges;
  }

  async getLeaderboard() {
    // Get top students by badge count
    const users = await this.prisma.user.findMany({
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

    return users
      .map(u => ({
        id: u.id,
        name: u.firstName || u.username,
        streak: u.currentStreak,
        badgeCount: u.badges.length,
        badges: u.badges.map(ub => ({
          code: ub.badge.code,
          name: ub.badge.name,
          icon: ub.badge.icon,
          tier: ub.badge.tier,
          category: ub.badge.category,
          earnedAt: ub.earnedAt,
        })),
      }))
      .sort((a, b) => b.badgeCount - a.badgeCount || b.streak - a.streak)
      .slice(0, 20);
  }

  async getUserPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
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
    if (!user) return null;

    const userBadges = await this.prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });

    const [completedCourses, enrollments, certificates] = await Promise.all([
      this.prisma.enrollment.count({ where: { userId, progress: { gte: 100 } } }),
      this.prisma.enrollment.count({ where: { userId } }),
      this.prisma.certificate.count({ where: { userId } }),
    ]);

    // Determine profile rank tier based on badge count
    const badgeCount = userBadges.length;
    let profileTier = 'bronze';
    if (badgeCount >= 20) profileTier = 'legendary';
    else if (badgeCount >= 15) profileTier = 'diamond';
    else if (badgeCount >= 10) profileTier = 'platinum';
    else if (badgeCount >= 6) profileTier = 'gold';
    else if (badgeCount >= 3) profileTier = 'silver';

    return {
      id: user.id,
      name: user.firstName || user.username,
      streak: user.currentStreak,
      joinedAt: user.createdAt,
      profileTier,
      stats: { badgeCount, completedCourses, enrollments, certificates },
      badges: userBadges.map(ub => ({
        code: ub.badge.code,
        name: ub.badge.name,
        icon: ub.badge.icon,
        tier: ub.badge.tier,
        category: ub.badge.category,
        description: ub.badge.description,
        earnedAt: ub.earnedAt,
      })),
    };
  }
}
