import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
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
