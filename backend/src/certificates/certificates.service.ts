import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CertificateRepository } from '../database/repositories';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';

@Injectable()
export class CertificatesService {
  constructor(
    private readonly certificateRepository: CertificateRepository,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(userId: string) {
    return this.certificateRepository.findByUser(userId);
  }

  async generate(courseId: string, userId: string) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { userId, courseId },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    if (enrollment.progress < 100) {
      throw new BadRequestException('You must complete 100% of the course to get a certificate');
    }

    const existing = await this.certificateRepository.findByUserAndCourse(userId, courseId);
    if (existing) throw new ConflictException('Certificate already issued for this course');

    return this.certificateRepository.create({
      userId,
      courseId,
      code: randomUUID(),
    });
  }

  async findByCode(code: string) {
    const certificate = await this.certificateRepository.findByCode(code);
    if (!certificate) throw new NotFoundException('Certificate not found');
    return certificate;
  }
}
