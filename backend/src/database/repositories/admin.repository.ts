import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

/**
 * Admin-specific repository for dashboard stats and aggregate queries.
 * This handles complex cross-entity queries that don't belong to a single domain repository.
 */
@Injectable()
export class AdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Aggregate counts for the admin dashboard */
  async getDashboardCounts() {
    const [
      totalUsers,
      totalCourses,
      totalLessons,
      totalEnrollments,
      usersByRole,
      coursesByStatus,
      revenue,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.course.count(),
      this.prisma.lesson.count(),
      this.prisma.enrollment.count(),
      this.prisma.user.groupBy({ by: ['role'], _count: { id: true } }),
      this.prisma.course.groupBy({ by: ['status'], _count: { id: true } }),
      this.prisma.order.aggregate({
        where: { status: OrderStatus.paid },
        _sum: { finalPrice: true },
      }),
    ]);

    return {
      totalUsers,
      totalCourses,
      totalLessons,
      totalEnrollments,
      usersByRole,
      coursesByStatus,
      revenue: Number(revenue._sum.finalPrice ?? 0),
    };
  }

  /** Recent users for dashboard */
  getRecentUsers(take = 5) {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take,
      select: { id: true, username: true, email: true, role: true, createdAt: true },
    });
  }

  /** Recent courses for dashboard */
  getRecentCourses(take = 5) {
    return this.prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        author: { select: { id: true, username: true } },
        _count: { select: { enrollments: true } },
      },
    });
  }

  /** Revenue by month (last 12 months) */
  async getMonthlyRevenue() {
    const now = new Date();
    const months: { month: string; revenue: number; orders: number }[] = [];

    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const label = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;

      const [agg, count] = await Promise.all([
        this.prisma.order.aggregate({
          where: { status: OrderStatus.paid, createdAt: { gte: start, lte: end } },
          _sum: { finalPrice: true },
        }),
        this.prisma.order.count({
          where: { status: OrderStatus.paid, createdAt: { gte: start, lte: end } },
        }),
      ]);

      months.push({ month: label, revenue: Number(agg._sum.finalPrice ?? 0), orders: count });
    }

    return months;
  }

  /** Course stats with enrollment count and average rating */
  async getCourseStats() {
    const courses = await this.prisma.course.findMany({
      include: {
        author: { select: { id: true, username: true, firstName: true } },
        _count: { select: { enrollments: true, reviews: true } },
        reviews: { select: { rating: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return courses.map(c => ({
      id: c.id,
      title: c.title,
      status: c.status,
      author: c.author,
      enrollments: c._count.enrollments,
      reviewCount: c._count.reviews,
      avgRating: c.reviews.length > 0
        ? +(c.reviews.reduce((s, r) => s + r.rating, 0) / c.reviews.length).toFixed(1)
        : null,
      createdAt: c.createdAt,
    }));
  }
}
