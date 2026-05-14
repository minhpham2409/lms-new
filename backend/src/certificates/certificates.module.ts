import { Module } from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { CertificatesController } from './certificates.controller';
import { PdfService } from './pdf.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CertificateRepository, CourseRepository, EnrollmentRepository, UserRepository } from '../database/repositories';

@Module({
  imports: [PrismaModule],
  controllers: [CertificatesController],
  providers: [CertificatesService, PdfService, CertificateRepository, CourseRepository, EnrollmentRepository, UserRepository],
  exports: [CertificatesService, PdfService],
})
export class CertificatesModule {}
