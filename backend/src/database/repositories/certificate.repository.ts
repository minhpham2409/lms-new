import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseRepository } from './base.repository';
import { Certificate } from '@prisma/client';

@Injectable()
export class CertificateRepository extends BaseRepository<Certificate> {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  get model() {
    return this.prisma.certificate;
  }

  findByUser(userId: string) {
    return this.prisma.certificate.findMany({
      where: {
        userId,
        course: { status: 'published' },
      },
      include: { course: { select: { id: true, title: true, thumbnail: true } } },
      orderBy: { issuedAt: 'desc' },
    });
  }

  findByCode(code: string) {
    return this.prisma.certificate.findUnique({
      where: { code },
      include: {
        user: { select: { id: true, username: true, firstName: true, lastName: true } },
        course: { select: { id: true, title: true, status: true } },
      },
    });
  }

  findByUserAndCourse(userId: string, courseId: string) {
    return this.prisma.certificate.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
  }
}
