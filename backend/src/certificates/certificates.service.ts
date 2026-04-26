import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CertificateRepository } from '../database/repositories';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { randomUUID } from 'crypto';

@Injectable()
export class CertificatesService {
  constructor(
    private readonly certificateRepository: CertificateRepository,
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(userId: string) {
    return this.certificateRepository.findByUser(userId);
  }

  async generate(courseId: string, userId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');
    if (course.status !== 'published') {
      throw new ForbiddenException('Certificates are only issued for published courses');
    }

    const enrollment = await this.prisma.enrollment.findFirst({
      where: { userId, courseId },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    if (enrollment.progress < 100) {
      throw new BadRequestException('You must complete 100% of the course to get a certificate');
    }

    const existing = await this.certificateRepository.findByUserAndCourse(userId, courseId);
    if (existing) throw new ConflictException('Certificate already issued for this course');

    const cert = await this.certificateRepository.create({
      userId,
      courseId,
      code: randomUUID(),
    });

    this.notificationsService.notifyUser(userId, {
      title: 'Certificate ready',
      message: `Your certificate for "${course.title}" has been issued. View it under Dashboard → Certificates.`,
      type: 'success',
    });

    return cert;
  }

  async findByCode(code: string) {
    const certificate = await this.certificateRepository.findByCode(code);
    if (!certificate) throw new NotFoundException('Certificate not found');
    if (certificate.course.status !== 'published') {
      throw new NotFoundException('Certificate not found');
    }
    return {
      ...certificate,
      course: { id: certificate.course.id, title: certificate.course.title },
    };
  }
}
