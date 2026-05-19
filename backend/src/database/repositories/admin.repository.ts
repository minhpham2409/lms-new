import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatus, WalletTransactionType } from '@prisma/client';

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

  /** Detailed revenue and payment reconciliation snapshot for admin finance view. */
  async getRevenueDetails() {
    const [
      paidAgg,
      receivedAgg,
      pendingAgg,
      remainingAgg,
      failedAgg,
      paidCount,
      pendingCount,
      failedCount,
      teacherEarnings,
      recentOrders,
      webhookEvents,
      refundRequests,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        where: { status: OrderStatus.paid },
        _sum: { totalPrice: true, finalPrice: true },
      }),
      this.prisma.payment.aggregate({
        _sum: { paidAmount: true, overpaidAmount: true },
      } as any),
      this.prisma.order.aggregate({
        where: { status: OrderStatus.pending },
        _sum: { finalPrice: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'pending' },
        _sum: { remainingAmount: true },
      } as any),
      this.prisma.order.aggregate({
        where: { status: OrderStatus.failed },
        _sum: { finalPrice: true },
      }),
      this.prisma.order.count({ where: { status: OrderStatus.paid } }),
      this.prisma.order.count({ where: { status: OrderStatus.pending } }),
      this.prisma.order.count({ where: { status: OrderStatus.failed } }),
      this.prisma.walletTransaction.aggregate({
        where: { type: WalletTransactionType.EARNING },
        _sum: { amount: true },
      }),
      this.prisma.order.findMany({
        where: { status: OrderStatus.paid },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: {
          user: { select: { id: true, username: true, email: true } },
          payment: true,
          items: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                  author: { select: { id: true, username: true, firstName: true, lastName: true } },
                },
              },
            },
          },
        },
      }),
      this.prisma.webhookEvent.findMany({
        where: { status: { in: ['rejected', 'failed'] } },
        orderBy: { receivedAt: 'desc' },
        take: 10,
      }),
      (this.prisma as any).refundRequest.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          parent: { select: { id: true, username: true, email: true, firstName: true, lastName: true } },
          order: { select: { id: true, userId: true, status: true } },
        },
      }),
    ]);

    const paidOrders = await this.prisma.order.findMany({
      where: { status: OrderStatus.paid },
      include: {
        items: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                author: { select: { id: true, username: true, firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });

    const topCourses = new Map<string, {
      id: string;
      title: string;
      teacher: unknown;
      revenue: number;
      orders: number;
    }>();

    for (const order of paidOrders) {
      const totalPrice = Number(order.totalPrice);
      const finalPrice = Number(order.finalPrice);
      for (const item of order.items) {
        const itemPrice = Number(item.price);
        const allocatedRevenue = totalPrice > 0 ? finalPrice * (itemPrice / totalPrice) : 0;
        const current = topCourses.get(item.courseId) ?? {
          id: item.courseId,
          title: item.course?.title ?? 'Khóa học',
          teacher: item.course?.author ?? null,
          revenue: 0,
          orders: 0,
        };
        current.revenue += allocatedRevenue;
        current.orders += 1;
        topCourses.set(item.courseId, current);
      }
    }

    const grossRevenue = Number(paidAgg._sum.finalPrice ?? 0);
    const receivedRevenue = Number((receivedAgg as any)._sum.paidAmount ?? 0);
    const listPriceRevenue = Number(paidAgg._sum.totalPrice ?? 0);
    const discountTotal = Math.max(listPriceRevenue - grossRevenue, 0);
    const teacherRevenue = Number(teacherEarnings._sum.amount ?? 0);

    return {
      summary: {
        grossRevenue,
        receivedRevenue,
        listPriceRevenue,
        discountTotal,
        teacherRevenue,
        platformRevenue: Math.max(grossRevenue - teacherRevenue, 0),
        pendingAmount: Number((remainingAgg as any)._sum.remainingAmount ?? pendingAgg._sum.finalPrice ?? 0),
        overpaidAmount: Number((receivedAgg as any)._sum.overpaidAmount ?? 0),
        failedAmount: Number(failedAgg._sum.finalPrice ?? 0),
        paidOrders: paidCount,
        pendingOrders: pendingCount,
        failedOrders: failedCount,
      },
      topCourses: Array.from(topCourses.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8),
      recentOrders,
      paymentIssues: webhookEvents,
      refundRequests,
    };
  }

  listRefundRequests() {
    return (this.prisma as any).refundRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        parent: { select: { id: true, username: true, email: true, firstName: true, lastName: true } },
        order: { select: { id: true, userId: true, status: true } },
      },
    });
  }

  markRefundPaid(id: string, adminId: string, bankTransferRef?: string) {
    return (this.prisma as any).refundRequest.update({
      where: { id },
      data: {
        status: 'PAID',
        processedByAdminId: adminId,
        processedAt: new Date(),
        bankTransferRef,
      },
    });
  }
}
