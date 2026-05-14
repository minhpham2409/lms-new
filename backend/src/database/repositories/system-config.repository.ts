import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseRepository } from './base.repository';
import { SystemConfig } from '@prisma/client';

@Injectable()
export class SystemConfigRepository extends BaseRepository<SystemConfig> {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  get model() {
    return this.prisma.systemConfig;
  }

  async getByKey(key: string): Promise<SystemConfig | null> {
    return this.prisma.systemConfig.findUnique({ where: { key } });
  }

  async upsertByKey(key: string, value: any, description?: string) {
    return this.prisma.systemConfig.upsert({
      where: { key },
      create: { key, value, description },
      update: { value, description },
    });
  }
}
