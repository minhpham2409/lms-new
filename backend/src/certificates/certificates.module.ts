import { Module } from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { CertificatesController } from './certificates.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CertificateRepository } from '../database/repositories';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [CertificatesController],
  providers: [CertificatesService, CertificateRepository],
  exports: [CertificatesService],
})
export class CertificatesModule {}
