import { Injectable, Logger } from '@nestjs/common';
import { WalletTransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Handles all database queries for the Tax Report feature.
 * Aggregates revenue by course/month for a given teacher from paid orders.
 * Each course sold = how many students enrolled + total revenue.
 */
@Injectable()
export class TaxReportsService {
  private readonly logger = new Logger(TaxReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private getCourseIdFromTransaction(idempotencyKey?: string | null) {
    return idempotencyKey?.split(':')?.[2] || null;
  }

  /**
   * Get revenue breakdown by course for a specific month.
   * Shows: course name, number of students, total revenue.
   */
  async getMonthlyReport(teacherId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const teacher = await this.prisma.user.findUnique({
      where: { id: teacherId },
      select: { id: true, firstName: true, lastName: true },
    });

    const earningTransactions = await this.prisma.walletTransaction.findMany({
      where: {
        type: WalletTransactionType.EARNING,
        wallet: { userId: teacherId },
        createdAt: { gte: startDate, lt: endDate },
      },
      select: {
        amount: true,
        idempotencyKey: true,
      },
    });

    // Fetch course names for matched courseIds
    const revenueByCourse = new Map<string, { revenue: number; studentCount: number }>();
    for (const transaction of earningTransactions) {
      const courseId = this.getCourseIdFromTransaction(transaction.idempotencyKey);
      if (!courseId) continue;
      const current = revenueByCourse.get(courseId) || { revenue: 0, studentCount: 0 };
      current.revenue += Number(transaction.amount || 0);
      current.studentCount += 1;
      revenueByCourse.set(courseId, current);
    }

    const courseIds = Array.from(revenueByCourse.keys());
    const courses = await this.prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: { id: true, title: true, price: true },
    });
    const courseMap = new Map(courses.map((c) => [c.id, c]));

    const courseReports = Array.from(revenueByCourse.entries()).map(([courseId, data]) => {
      const course = courseMap.get(courseId);
      return {
        courseId,
        courseName: course?.title ?? 'Khóa học đã xóa',
        coursePrice: Number(course?.price ?? 0),
        studentCount: data.studentCount,
        revenue: data.revenue,
      };
    });

    // Sort by revenue descending
    courseReports.sort((a, b) => b.revenue - a.revenue);

    const totalStudents = courseReports.reduce((sum, c) => sum + c.studentCount, 0);
    const totalRevenue = courseReports.reduce((sum, c) => sum + c.revenue, 0);

    return {
      teacher: {
        id: teacher?.id,
        fullName: [teacher?.lastName, teacher?.firstName]
          .filter(Boolean)
          .join(' '),
      },
      period: { type: 'monthly' as const, year, month },
      courses: courseReports,
      totalStudents,
      totalRevenue,
    };
  }

  /**
   * Get revenue breakdown by course for a quarter (3 months).
   * For each course: student count + revenue per month + total.
   */
  async getQuarterlyReport(teacherId: string, year: number, quarter: number) {
    const startMonth = (quarter - 1) * 3 + 1;
    const months = [startMonth, startMonth + 1, startMonth + 2];
    const startDate = new Date(year, startMonth - 1, 1);
    const endDate = new Date(year, startMonth + 2, 1);

    const teacher = await this.prisma.user.findUnique({
      where: { id: teacherId },
      select: { id: true, firstName: true, lastName: true },
    });

    const earningTransactions = await this.prisma.walletTransaction.findMany({
      where: {
        type: WalletTransactionType.EARNING,
        wallet: { userId: teacherId },
        createdAt: { gte: startDate, lt: endDate },
      },
      select: {
        amount: true,
        createdAt: true,
        idempotencyKey: true,
      },
    });

    const courseIds = Array.from(
      new Set(
        earningTransactions
          .map((transaction) => this.getCourseIdFromTransaction(transaction.idempotencyKey))
          .filter(Boolean) as string[],
      ),
    );
    const courses = await this.prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: { id: true, title: true, price: true },
    });
    const courseMap = new Map(courses.map((course) => [course.id, course]));

    // Build maps: courseId → { month → { revenue, count } }
    const courseMonthlyMap = new Map<
      string,
      { title: string; price: number; data: Record<number, { revenue: number; count: number }> }
    >();

    for (const transaction of earningTransactions) {
      const courseId = this.getCourseIdFromTransaction(transaction.idempotencyKey);
      if (!courseId) continue;
      const course = courseMap.get(courseId);
      const itemMonth = transaction.createdAt.getMonth() + 1;
      if (!courseMonthlyMap.has(courseId)) {
        courseMonthlyMap.set(courseId, {
          title: course?.title ?? 'Khóa học đã xóa',
          price: Number(course?.price ?? 0),
          data: {},
        });
      }
      const entry = courseMonthlyMap.get(courseId)!;
      if (!entry.data[itemMonth]) {
        entry.data[itemMonth] = { revenue: 0, count: 0 };
      }
      entry.data[itemMonth].revenue += Number(transaction.amount || 0);
      entry.data[itemMonth].count += 1;
    }

    const courseReports = Array.from(courseMonthlyMap.entries()).map(
      ([courseId, entry]) => {
        const monthlyRevenue: Record<string, number> = {};
        const monthlyStudents: Record<string, number> = {};
        let total = 0;
        let totalStudents = 0;
        for (const m of months) {
          const d = entry.data[m] ?? { revenue: 0, count: 0 };
          monthlyRevenue[String(m)] = d.revenue;
          monthlyStudents[String(m)] = d.count;
          total += d.revenue;
          totalStudents += d.count;
        }
        return {
          courseId,
          courseName: entry.title,
          coursePrice: entry.price,
          monthlyRevenue,
          monthlyStudents,
          total,
          totalStudents,
        };
      },
    );

    // Sort by total revenue descending
    courseReports.sort((a, b) => b.total - a.total);

    // Monthly totals
    const monthlyTotals: Record<string, number> = {};
    const monthlyStudentTotals: Record<string, number> = {};
    let grandTotal = 0;
    let grandTotalStudents = 0;
    for (const m of months) {
      const monthRevenue = courseReports.reduce(
        (sum, c) => sum + (c.monthlyRevenue[String(m)] ?? 0),
        0,
      );
      const monthStudents = courseReports.reduce(
        (sum, c) => sum + (c.monthlyStudents[String(m)] ?? 0),
        0,
      );
      monthlyTotals[String(m)] = monthRevenue;
      monthlyStudentTotals[String(m)] = monthStudents;
      grandTotal += monthRevenue;
      grandTotalStudents += monthStudents;
    }

    return {
      teacher: {
        id: teacher?.id,
        fullName: [teacher?.lastName, teacher?.firstName]
          .filter(Boolean)
          .join(' '),
      },
      period: { type: 'quarterly' as const, year, quarter, months },
      courses: courseReports,
      monthlyTotals,
      monthlyStudentTotals,
      grandTotal,
      grandTotalStudents,
    };
  }

  /**
   * Get list of students who purchased a specific course in a given month.
   * Shows: student name, email, purchase date, amount paid.
   */
  async getCourseStudents(
    teacherId: string,
    courseId: string,
    year: number,
    month: number,
  ) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    // Verify teacher owns this course
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, authorId: teacherId },
      select: { id: true, title: true, price: true },
    });

    if (!course) {
      return { courseName: '', coursePrice: 0, students: [] };
    }

    const earningTransactions = await this.prisma.walletTransaction.findMany({
      where: {
        type: WalletTransactionType.EARNING,
        wallet: { userId: teacherId },
        createdAt: { gte: startDate, lt: endDate },
        idempotencyKey: { contains: `:${courseId}:` },
      },
      select: {
        amount: true,
        createdAt: true,
        referenceId: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const orderIds = earningTransactions
      .map((transaction) => transaction.referenceId)
      .filter(Boolean) as string[];
    const orders = await this.prisma.order.findMany({
      where: { id: { in: orderIds } },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            username: true,
          },
        },
      },
    });
    const orderMap = new Map(orders.map((order) => [order.id, order]));

    const students = earningTransactions.map((transaction, index) => {
      const order = transaction.referenceId ? orderMap.get(transaction.referenceId) : null;
      const user = order?.user;
      return {
        stt: index + 1,
        fullName: user
          ? [user.lastName, user.firstName].filter(Boolean).join(' ') || user.username
          : 'Học sinh',
        email: user?.email ?? '',
        purchaseDate: transaction.createdAt,
        amountPaid: Number(transaction.amount || 0),
      };
    });

    return {
      courseName: course.title,
      coursePrice: Number(course.price),
      students,
    };
  }
}
