import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Repository for parent-specific dashboard queries.
 * Handles complex cross-entity lookups for parent monitoring features.
 */
@Injectable()
export class ParentDashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Resolve user by UUID, email, or username */
  async resolveStudentUser(raw: string) {
    const s = raw.trim();

    // Check UUID
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)) {
      return this.prisma.user.findUnique({ where: { id: s } });
    }

    // Check email (contains @)
    if (s.includes('@')) {
      const rows = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM User WHERE lower(email) = lower(${s}) LIMIT 1
      `;
      if (!rows[0]) return null;
      return this.prisma.user.findUnique({ where: { id: rows[0].id } });
    }

    // Try exact username
    const exact = await this.prisma.user.findUnique({ where: { username: s } });
    if (exact) return exact;

    // Case-insensitive username search
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM User WHERE lower(username) = lower(${s}) LIMIT 1
    `;
    if (!rows[0]) return null;
    return this.prisma.user.findUnique({ where: { id: rows[0].id } });
  }

  /** Get child's enrollments */
  getChildEnrollments(childId: string) {
    return this.prisma.enrollment.findMany({
      where: { userId: childId },
      include: {
        course: { select: { id: true, title: true, thumbnail: true } },
      },
    });
  }

  /** Get child's courses with full details */
  getChildCourses(childId: string) {
    return this.prisma.enrollment.findMany({
      where: { userId: childId },
      include: {
        course: {
          include: {
            author: { select: { id: true, username: true } },
            _count: { select: { sections: true } },
          },
        },
      },
    });
  }

  /** Get child profile data */
  getChildProfile(childId: string) {
    return this.prisma.user.findUnique({
      where: { id: childId },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        isActive: true,
      },
    });
  }

  /** Get child's enrollments with full course + author details */
  getChildEnrollmentsDetailed(childId: string) {
    return this.prisma.enrollment.findMany({
      where: { userId: childId },
      orderBy: { createdAt: 'desc' },
      include: {
        course: {
          include: {
            author: {
              select: { id: true, username: true, firstName: true, lastName: true, email: true },
            },
            _count: { select: { sections: true } },
          },
        },
      },
    });
  }

  /** Get section lesson counts for courses */
  getSectionLessonCounts(courseIds: string[]) {
    if (courseIds.length === 0) return Promise.resolve([]);
    return this.prisma.section.findMany({
      where: { courseId: { in: courseIds } },
      select: { courseId: true, _count: { select: { lessons: true } } },
    });
  }

  /** Get completed video lessons for courses */
  getCompletedVideoLessons(childId: string, courseIds: string[]) {
    if (courseIds.length === 0) return Promise.resolve([]);
    return this.prisma.videoProgress.findMany({
      where: {
        userId: childId,
        completed: true,
        lesson: { section: { courseId: { in: courseIds } } },
      },
      select: { lesson: { select: { section: { select: { courseId: true } } } } },
    });
  }

  /** Get all started video progress rows for linked child courses */
  getStartedVideoProgress(childId: string, courseIds: string[]) {
    if (courseIds.length === 0) return Promise.resolve([]);
    return this.prisma.videoProgress.findMany({
      where: {
        userId: childId,
        OR: [{ watchTime: { gt: 0 } }, { watchedPercentage: { gt: 0 } }, { completed: true }],
        lesson: { section: { courseId: { in: courseIds } } },
      },
      select: {
        id: true,
        watchTime: true,
        watchedPercentage: true,
        completed: true,
        updatedAt: true,
        lesson: {
          select: {
            id: true,
            title: true,
            section: {
              select: {
                courseId: true,
                course: { select: { id: true, title: true } },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /** Get badges already earned by a child */
  getChildBadges(childId: string) {
    return this.prisma.userBadge.findMany({
      where: { userId: childId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });
  }

  /** Get activity counts */
  async getActivityCounts(childId: string) {
    const [quizAttemptsCount, submissionCount] = await Promise.all([
      this.prisma.quizAttempt.count({ where: { studentId: childId } }),
      this.prisma.submission.count({ where: { studentId: childId } }),
    ]);
    return { quizAttemptsCount, submissionCount };
  }

  /** Get child's orders */
  getChildOrders(childId: string) {
    return this.prisma.order.findMany({
      where: { userId: childId },
      include: {
        items: {
          include: {
            course: { select: { id: true, title: true, price: true, thumbnail: true } },
          },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  getPaymentIssuesByTxnRefs(txnRefs: string[]) {
    if (txnRefs.length === 0) return Promise.resolve([]);
    return this.prisma.webhookEvent.findMany({
      where: {
        txnRef: { in: txnRefs },
        status: { in: ['rejected', 'failed'] },
      },
      orderBy: { receivedAt: 'desc' },
    });
  }

  /** Get child's graded submissions */
  getChildGrades(childId: string) {
    return this.prisma.submission.findMany({
      where: { studentId: childId },
      include: {
        assignment: {
          include: {
            lesson: {
              select: {
                id: true,
                title: true,
                section: {
                  select: {
                    title: true,
                    course: { select: { id: true, title: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
