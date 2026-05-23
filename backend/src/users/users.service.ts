import { Injectable } from '@nestjs/common';
import { UserRepository, StudentDashboardRepository } from '../database/repositories';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
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
    private readonly userRepository: UserRepository,
    private readonly dashboardRepository: StudentDashboardRepository,
    private readonly notificationsService: NotificationsService,
    private readonly achievementsService: AchievementsService,
  ) {}

  async findAll() {
    return this.userRepository.findMany({
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
    return this.userRepository.findPublicTeachers();
  }

  async findPublicTeacherById(id: string) {
    return this.userRepository.findPublicTeacherById(id);
  }

  async submitTeacherApplication(payload: {
    fullName?: string;
    email?: string;
    phone?: string;
    expertise?: string;
    experience?: string;
    message?: string;
  }) {
    const fullName = payload.fullName?.trim();
    const email = payload.email?.trim();
    if (!fullName || !email) {
      return { ok: false, message: 'Full name and email are required' };
    }

    const admins = await this.userRepository.findAdmins();
    const message = JSON.stringify({
      fullName,
      email,
      phone: payload.phone?.trim() || '',
      expertise: payload.expertise?.trim() || '',
      experience: payload.experience?.trim() || '',
      message: payload.message?.trim() || '',
      submittedAt: new Date().toISOString(),
    });

    for (const admin of admins) {
      this.notificationsService.notifyUser(admin.id, {
        title: `Đơn đăng ký giảng viên: ${fullName}`,
        message,
        type: 'teacher_application',
      });
    }

    return { ok: true, message: 'Teacher application submitted' };
  }

  async findOne(id: string) {
    return this.userRepository.findById(id);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    return this.userRepository.update(id, updateUserDto);
  }

  /**
   * Safe self-update: strips dangerous fields (role, isActive, password).
   * Users cannot elevate privileges through this endpoint.
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const { firstName, lastName, bio, avatarUrl } = dto;
    return this.userRepository.update(userId, { firstName, lastName, bio, avatarUrl });
  }

  async remove(id: string) {
    return this.userRepository.delete(id);
  }

  async getStudentDashboard(userId: string) {
    const user = await this.dashboardRepository.getUserStreak(userId);

    // Gather activities from multiple real sources
    const activities: Array<{ text: string; time: Date; type: string }> = [];

    const [recentVideos, recentQuizzes, recentSubmissions, recentEnrollments] =
      await Promise.all([
        this.dashboardRepository.getRecentCompletedVideos(userId),
        this.dashboardRepository.getRecentQuizAttempts(userId),
        this.dashboardRepository.getRecentSubmissions(userId),
        this.dashboardRepository.getRecentEnrollments(userId),
      ]);

    for (const v of recentVideos) {
      activities.push({ text: `Hoàn thành bài: ${v.lesson.title}`, time: v.updatedAt, type: 'lesson' });
    }
    for (const q of recentQuizzes) {
      const name = q.quiz?.assignment?.title || 'Quiz';
      activities.push({ text: `Đạt ${q.score}/${q.maxScore} — ${name}`, time: q.createdAt, type: 'quiz' });
    }
    for (const s of recentSubmissions) {
      activities.push({ text: `Nộp bài: ${s.assignment.title}`, time: s.createdAt, type: 'submission' });
    }
    for (const e of recentEnrollments) {
      activities.push({ text: `Đăng ký khóa: ${e.course.title}`, time: e.createdAt, type: 'enrollment' });
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

  async getLearningSummary(userId: string) {
    const enrollments = await this.dashboardRepository.getActiveEnrollmentsWithLessons(userId);
    const courseIds = enrollments.map((e) => e.courseId);

    const [videoRows, taskRows, gradedRows, quizRows] = await Promise.all([
      this.dashboardRepository.getVideoProgressForCourses(userId, courseIds),
      this.dashboardRepository.getPendingLearningTasks(userId, courseIds),
      this.dashboardRepository.getRecentGradedSubmissions(userId, courseIds),
      this.dashboardRepository.getRecentQuizResults(userId, courseIds),
    ]);

    const progressByLesson = new Map(videoRows.map((row) => [row.lessonId, row]));

    const courses = enrollments.map((enrollment) => {
      const lessons = enrollment.course.sections.flatMap((section) => section.lessons);
      const completedLessons = lessons.filter((lesson) => progressByLesson.get(lesson.id)?.completed).length;
      const totalLessons = lessons.length;
      const nextLesson =
        lessons.find((lesson) => !progressByLesson.get(lesson.id)?.completed) ?? lessons[0] ?? null;

      return {
        enrollmentId: enrollment.id,
        courseId: enrollment.courseId,
        title: enrollment.course.title,
        thumbnail: enrollment.course.thumbnail,
        teacher: enrollment.course.author,
        progress: enrollment.progress,
        totalLessons,
        completedLessons,
        nextLesson: nextLesson
          ? {
              id: nextLesson.id,
              title: nextLesson.title,
              duration: nextLesson.duration,
              watchTime: progressByLesson.get(nextLesson.id)?.watchTime ?? 0,
              watchedPercentage: progressByLesson.get(nextLesson.id)?.watchedPercentage ?? 0,
              url: `/courses/${enrollment.courseId}/lessons/${nextLesson.id}`,
            }
          : null,
      };
    });

    const latestInProgress = videoRows.find((row) => !row.completed);
    const fallbackCourse = courses.find((course) => course.nextLesson);
    const continueLearning = latestInProgress
      ? {
          courseId: latestInProgress.lesson.section.courseId,
          lessonId: latestInProgress.lessonId,
          lessonTitle: latestInProgress.lesson.title,
          watchTime: latestInProgress.watchTime,
          watchedPercentage: latestInProgress.watchedPercentage,
          url: `/courses/${latestInProgress.lesson.section.courseId}/lessons/${latestInProgress.lessonId}`,
        }
      : fallbackCourse?.nextLesson
        ? {
            courseId: fallbackCourse.courseId,
            lessonId: fallbackCourse.nextLesson.id,
            lessonTitle: fallbackCourse.nextLesson.title,
            watchTime: fallbackCourse.nextLesson.watchTime,
            watchedPercentage: fallbackCourse.nextLesson.watchedPercentage,
            url: fallbackCourse.nextLesson.url,
          }
        : null;

    const todos = taskRows
      .filter((task) => {
        if (task.type === 'quiz') return (task.quiz?.attempts?.length ?? 0) === 0;
        return task.submissions.length === 0;
      })
      .slice(0, 12)
      .map((task) => ({
        id: task.id,
        title: task.title,
        type: task.type,
        dueDate: task.dueDate,
        maxScore: task.maxScore,
        courseId: task.lesson.section.courseId,
        courseTitle: task.lesson.section.course.title,
        lessonId: task.lessonId,
        lessonTitle: task.lesson.title,
        url:
          task.type === 'quiz' && task.quiz?.id
            ? `/quiz/${task.quiz.id}`
            : `/courses/${task.lesson.section.courseId}/lessons/${task.lessonId}`,
      }));

    const feedback = [
      ...gradedRows.map((row) => ({
        id: row.id,
        kind: 'assignment',
        title: row.assignment.title,
        courseTitle: row.assignment.lesson.section.course.title,
        lessonTitle: row.assignment.lesson.title,
        score: row.score,
        maxScore: row.assignment.maxScore,
        feedback: row.feedback,
        gradedAt: row.gradedAt,
        url: `/courses/${row.assignment.lesson.section.courseId}/lessons/${row.assignment.lesson.id}`,
      })),
      ...quizRows.map((row) => ({
        id: row.id,
        kind: 'quiz',
        title: row.quiz.assignment.title,
        courseTitle: row.quiz.assignment.lesson.section.course.title,
        lessonTitle: row.quiz.assignment.lesson.title,
        score: row.score,
        maxScore: row.maxScore,
        feedback: null,
        gradedAt: row.updatedAt,
        url: `/courses/${row.quiz.assignment.lesson.section.courseId}/lessons/${row.quiz.assignment.lesson.id}`,
      })),
    ]
      .sort((a, b) => new Date(b.gradedAt ?? 0).getTime() - new Date(a.gradedAt ?? 0).getTime())
      .slice(0, 8);

    return {
      courses,
      continueLearning,
      todos,
      feedback,
      stats: {
        activeCourses: courses.length,
        completedCourses: courses.filter((course) => course.progress >= 100).length,
        pendingTasks: todos.length,
        gradedItems: feedback.length,
      },
    };
  }

  async checkInStreak(userId: string) {
    const user = await this.dashboardRepository.getUserFull(userId);
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
        const activeCoupon = await this.dashboardRepository.findActiveStreakCoupon(userId);
        return { streak: newStreak, rewarded: false, reward: null, nextReward, activeCoupon };
      } else if (diffDays === 1) {
        newStreak += 1;
      } else {
        newStreak = 1; // streak broken
      }
    }

    await this.dashboardRepository.updateStreak(userId, {
      currentStreak: newStreak,
      lastActivityDate: now,
    });

    let reward = null;
    const milestone = STREAK_REWARDS.find(r => r.days === newStreak);

    if (milestone) {
      // Deactivate ALL previous streak coupons for this user (single active coupon rule)
      await this.dashboardRepository.deactivateStreakCoupons(userId);

      const code = `STREAK${milestone.days}-${userId.substring(0, 4).toUpperCase()}${Math.floor(Math.random() * 9000 + 1000)}`;
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);

      await this.dashboardRepository.createStreakCoupon({
        code,
        discount: milestone.discount,
        maxUses: 1,
        expiresAt: expiry,
        isActive: true,
        type: 'streak',
        userId,
      });

      this.notificationsService.notifyUser(userId, {
        title: `Phần thưởng ${milestone.label}!`,
        message: `Bạn nhận mã giảm giá ${milestone.discount}%: ${code}. Mã cá nhân, có hiệu lực 30 ngày.`,
        type: 'reward',
      });

      reward = { code, discount: milestone.discount, label: milestone.label };
    }

    const nextReward = STREAK_REWARDS.find(r => r.days > newStreak) || null;
    const activeCoupon = await this.dashboardRepository.findActiveStreakCoupon(userId);

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
    const coupon = await this.dashboardRepository.findActiveStreakCoupon(userId);
    if (!coupon) return null;

    // Check if already fully used
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return null;
    }

    return coupon;
  }
}
