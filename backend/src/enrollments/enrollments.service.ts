import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class EnrollmentsService {
  constructor(
    private prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async enroll(userId: string, courseId: string) {
    const existingEnrollment = await this.prisma.enrollment.findFirst({
      where: { userId, courseId },
    });

    if (existingEnrollment) {
      throw new ConflictException('User is already enrolled in this course');
    }

    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');
    if (course.status !== 'published') {
      throw new BadRequestException(
        'This course is not available for enrollment yet',
      );
    }

    // Paid courses must go through the payment flow
    if (course.price > 0) {
      throw new BadRequestException(
        'This is a paid course. Please purchase it through the cart and payment flow.',
      );
    }

    const enrollment = await this.prisma.enrollment.create({
      data: { userId, courseId },
      include: { course: true },
    });

    this.notificationsService.notifyUser(userId, {
      title: 'Enrollment confirmed',
      message: `You are enrolled in "${course.title}". Open Dashboard → My courses to start learning.`,
      type: 'success',
    });

    return enrollment;
  }

  /** Create a pending enrollment for paid courses (after order is created) */
  async createPending(userId: string, courseId: string) {
    const existingEnrollment = await this.prisma.enrollment.findFirst({
      where: { userId, courseId },
    });

    if (existingEnrollment) {
      // If already pending, just return it
      if (existingEnrollment.status === 'pending') return existingEnrollment;
      throw new ConflictException('User is already enrolled in this course');
    }

    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    const enrollment = await this.prisma.enrollment.create({
      data: { userId, courseId, status: 'pending', progress: 0 },
      include: { course: true },
    });

    // Notify the course teacher
    if (course.authorId) {
      this.notificationsService.notifyUser(course.authorId, {
        title: 'Học sinh mới chờ duyệt',
        message: `Có học sinh đăng ký khóa "${course.title}" và đang chờ duyệt.`,
        type: 'info',
      });
    }

    // Also notify the student's parent(s)
    const parentLinks = await this.prisma.parentChild.findMany({
      where: { childId: userId, status: 'accepted' },
    });
    for (const link of parentLinks) {
      this.notificationsService.notifyUser(link.parentId, {
        title: 'Con bạn đăng ký khóa học',
        message: `Con bạn đã đăng ký khóa "${course.title}" và cần thanh toán.`,
        type: 'info',
      });
    }

    return enrollment;
  }

  /** Teacher/admin: get enrollments for a course, optionally filtered by status */
  async getEnrollmentsByCourse(courseId: string, user: any, status?: string) {
    // Verify the teacher owns the course (or is admin)
    if (user.role === 'teacher') {
      const course = await this.prisma.course.findUnique({ where: { id: courseId } });
      if (!course || course.authorId !== user.id) {
        throw new ForbiddenException('Not your course');
      }
    }

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

  /** Teacher/admin: approve a pending enrollment */
  async approveEnrollment(enrollmentId: string, user: any) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { course: true },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    // Check ownership
    if (user.role === 'teacher' && enrollment.course.authorId !== user.id) {
      throw new ForbiddenException('Not your course');
    }

    const updated = await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: 'active' },
      include: { course: true },
    });

    // Mark associated order(s) as paid so revenue is tracked
    try {
      const orderItems = await this.prisma.orderItem.findMany({
        where: {
          courseId: enrollment.courseId,
          order: {
            userId: enrollment.userId,
            status: { in: ['pending', 'processing'] },
          },
        },
        include: { order: true },
      });

      for (const item of orderItems) {
        await this.prisma.order.update({
          where: { id: item.orderId },
          data: { status: 'paid' },
        });
        // Also update payment if exists
        await this.prisma.payment.updateMany({
          where: { orderId: item.orderId, status: { not: 'paid' } },
          data: { status: 'paid', paidAt: new Date() },
        });
      }
    } catch {
      // Non-critical: revenue tracking should not block enrollment approval
    }

    // Notify student
    this.notificationsService.notifyUser(enrollment.userId, {
      title: 'Đã duyệt vào lớp!',
      message: `Bạn đã được duyệt vào khóa "${enrollment.course.title}". Bắt đầu học ngay!`,
      type: 'success',
    });

    return updated;
  }

  async getEnrollmentStatus(userId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { userId, courseId },
    });
    return { isEnrolled: !!enrollment, enrollment: enrollment || null };
  }

  async getUserEnrollments(userId: string) {
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

  async updateProgress(userId: string, courseId: string, progress: number) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { userId, courseId },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    return this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { progress },
    });
  }

  async unenroll(userId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { userId, courseId },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    return this.prisma.enrollment.delete({ where: { id: enrollment.id } });
  }
}
