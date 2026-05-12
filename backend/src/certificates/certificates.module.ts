import { Module } from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { CertificatesController } from './certificates.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CertificateRepository, CourseRepository, EnrollmentRepository } from '../database/repositories';

@Module({
  imports: [PrismaModule],
  controllers: [CertificatesController],
  providers: [CertificatesService, CertificateRepository, CourseRepository, EnrollmentRepository],
  exports: [CertificatesService],
})
export class CertificatesModule {}
