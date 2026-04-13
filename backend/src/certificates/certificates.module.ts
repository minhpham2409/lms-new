import { Module } from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { CertificatesController } from './certificates.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CertificateRepository } from '../database/repositories';

@Module({
  imports: [PrismaModule],
  controllers: [CertificatesController],
  providers: [CertificatesService, CertificateRepository],
  exports: [CertificatesService],
})
export class CertificatesModule {}
