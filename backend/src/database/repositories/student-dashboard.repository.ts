import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CouponType } from '@prisma/client';

/**
 * Repository for student-facing dashboard and streak queries.
 * Encapsulates complex cross-entity aggregations that don't belong to a single domain.
 */
@Injectable()
export class StudentDashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Get user streak info */
  getUserStreak(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { currentStreak: true, lastActivityDate: true },
    });
  }

  /** Get user full record for streak check-in */
  getUserFull(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  /** Update user streak */
  updateStreak(userId: string, data: { currentStreak: number; lastActivityDate: Date }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  /** Recent completed videos */
  getRecentCompletedVideos(userId: string, take = 3) {
    return this.prisma.videoProgress.findMany({
      where: { userId, completed: true },
      include: { lesson: { select: { title: true } } },
      orderBy: { updatedAt: 'desc' },
      take,
    });
  }

  /** Recent quiz attempts */
  getRecentQuizAttempts(userId: string, take = 3) {
    return this.prisma.quizAttempt.findMany({
      where: { studentId: userId },
      include: { quiz: { include: { assignment: { select: { title: true } } } } },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  /** Recent submissions */
  getRecentSubmissions(userId: string, take = 3) {
    return this.prisma.submission.findMany({
      where: { studentId: userId },
      include: { assignment: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  /** Recent enrollments */
  getRecentEnrollments(userId: string, take = 2) {
    return this.prisma.enrollment.findMany({
      where: { userId },
      include: { course: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  /** Recent certificates */
  getRecentCertificates(userId: string, take = 2) {
    return this.prisma.certificate.findMany({
      where: { userId },
      include: { course: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  /** Find active streak coupon */
  findActiveStreakCoupon(userId: string) {
    return this.prisma.coupon.findFirst({
      where: {
        userId,
        type: CouponType.streak,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: { discount: 'desc' },
    });
  }

  /** Deactivate all streak coupons for a user */
  deactivateStreakCoupons(userId: string) {
    return this.prisma.coupon.updateMany({
      where: { userId, type: CouponType.streak, isActive: true },
      data: { isActive: false },
    });
  }

  /** Create streak reward coupon */
  createStreakCoupon(data: {
    code: string;
    discount: number;
    maxUses: number;
    expiresAt: Date;
    isActive: boolean;
    type: string;
    userId: string;
  }) {
    return this.prisma.coupon.create({
      data: {
        ...data,
        type: (data.type as CouponType) ?? CouponType.streak,
      },
    });
  }

  getActiveEnrollmentsWithLessons(userId: string) {
    return this.prisma.enrollment.findMany({
      where: { userId, status: 'active' },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            author: { select: { id: true, username: true, firstName: true, lastName: true } },
            sections: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                order: true,
                lessons: {
                  orderBy: { order: 'asc' },
                  select: { id: true, title: true, order: true, duration: true, videoUrl: true },
                },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  getVideoProgressForCourses(userId: string, courseIds: string[]) {
    if (courseIds.length === 0) return Promise.resolve([]);
    return this.prisma.videoProgress.findMany({
      where: { userId, lesson: { section: { courseId: { in: courseIds } } } },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            order: true,
            section: { select: { courseId: true, title: true, order: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  getPendingLearningTasks(userId: string, courseIds: string[], take = 12) {
    if (courseIds.length === 0) return Promise.resolve([]);
    return this.prisma.assignment.findMany({
      where: {
        lesson: { section: { courseId: { in: courseIds } } },
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            section: { select: { courseId: true, title: true, course: { select: { title: true } } } },
          },
        },
        quiz: {
          select: {
            id: true,
            attempts: {
              where: { studentId: userId },
              select: { id: true, score: true, maxScore: true, createdAt: true },
            },
          },
        },
        submissions: {
          where: { studentId: userId },
          select: { id: true, status: true, score: true, feedback: true, createdAt: true, gradedAt: true },
        },
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      take: take * 2,
    });
  }

  getRecentGradedSubmissions(userId: string, courseIds: string[], take = 6) {
    if (courseIds.length === 0) return Promise.resolve([]);
    return this.prisma.submission.findMany({
      where: {
        studentId: userId,
        status: 'graded',
        assignment: { lesson: { section: { courseId: { in: courseIds } } } },
      },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            maxScore: true,
            lesson: {
              select: {
                id: true,
                title: true,
                section: { select: { courseId: true, course: { select: { title: true } } } },
              },
            },
          },
        },
      },
      orderBy: { gradedAt: 'desc' },
      take,
    });
  }

  getRecentQuizResults(userId: string, courseIds: string[], take = 6) {
    if (courseIds.length === 0) return Promise.resolve([]);
    return this.prisma.quizAttempt.findMany({
      where: {
        studentId: userId,
        quiz: { assignment: { lesson: { section: { courseId: { in: courseIds } } } } },
      },
      include: {
        quiz: {
          select: {
            assignment: {
              select: {
                id: true,
                title: true,
                lesson: {
                  select: {
                    id: true,
                    title: true,
                    section: { select: { courseId: true, course: { select: { title: true } } } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take,
    });
  }
}
