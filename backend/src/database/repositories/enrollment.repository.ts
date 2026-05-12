import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseRepository } from './base.repository';
import { Enrollment } from '@prisma/client';

@Injectable()
export class EnrollmentRepository extends BaseRepository<Enrollment> {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  get model() {
    return this.prisma.enrollment;
  }

  findByUserAndCourse(userId: string, courseId: string) {
    return this.prisma.enrollment.findFirst({
      where: { userId, courseId },
    });
  }

  createEnrollment(userId: string, courseId: string, options?: { status?: string; progress?: number }) {
    return this.prisma.enrollment.create({
      data: {
        userId,
        courseId,
        status: options?.status,
        progress: options?.progress ?? 0,
      },
      include: { course: true },
    });
  }

  findByIdWithCourse(id: string) {
    return this.prisma.enrollment.findUnique({
      where: { id },
      include: { course: true },
    });
  }

  findByCourse(courseId: string, status?: string) {
    const where: any = { courseId };
    if (status) where.status = status;

    return this.prisma.enrollment.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, firstName: true, lastName: true, email: true } },
        course: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findByUser(userId: string) {
    return this.prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            author: { select: { id: true, username: true, firstName: true, lastName: true } },
            sections: {
              orderBy: { order: 'asc' },
              include: {
                lessons: {
                  select: { id: true, title: true, order: true },
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
      },
    });
  }

  updateStatus(id: string, status: string) {
    return this.prisma.enrollment.update({
      where: { id },
      data: { status },
      include: { course: true },
    });
  }

  updateProgress(id: string, progress: number) {
    return this.prisma.enrollment.update({
      where: { id },
      data: { progress },
    });
  }

  deleteEnrollment(id: string) {
    return this.prisma.enrollment.delete({ where: { id } });
  }

  /** Find order items linked to a user+course enrollment for revenue tracking */
  findOrderItemsForEnrollment(userId: string, courseId: string) {
    return this.prisma.orderItem.findMany({
      where: {
        courseId,
        order: {
          userId,
          status: { in: ['pending', 'processing'] },
        },
      },
      include: { order: true },
    });
  }

  /** Find parent links for a user (accepted) */
  findParentLinks(childId: string) {
    return this.prisma.parentChild.findMany({
      where: { childId, status: 'accepted' },
    });
  }

  /**
   * ATOMIC TRANSACTION: Approve enrollment → mark orders as paid → mark payments as paid.
   *
   * All-or-nothing: if any step fails, the entire operation is rolled back.
   * This prevents inconsistent states like:
   * - Enrollment active but order still pending
   * - Order marked paid but payment not updated
   */
  async approveEnrollmentTransaction(params: {
    enrollmentId: string;
    userId: string;
    courseId: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Activate the enrollment
      const updated = await tx.enrollment.update({
        where: { id: params.enrollmentId },
        data: { status: 'active' },
        include: { course: true },
      });

      // 2. Find related pending/processing order items
      const orderItems = await tx.orderItem.findMany({
        where: {
          courseId: params.courseId,
          order: {
            userId: params.userId,
            status: { in: ['pending', 'processing'] },
          },
        },
        select: { orderId: true },
      });

      // 3. Mark all related orders as paid
      const orderIds = [...new Set(orderItems.map((item) => item.orderId))];
      for (const orderId of orderIds) {
        await tx.order.update({
          where: { id: orderId },
          data: { status: 'paid' },
        });

        // 4. Mark related payments as paid
        await tx.payment.updateMany({
          where: { orderId, status: { not: 'completed' } },
          data: { status: 'completed', paidAt: new Date() },
        });
      }

      return updated;
    });
  }
}
