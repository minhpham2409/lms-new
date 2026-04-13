import { Injectable } from '@nestjs/common';
import { Material } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseRepository } from './base.repository';

@Injectable()
export class MaterialRepository extends BaseRepository<Material> {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  get model() {
    return this.prisma.material;
  }

  async findByLessonId(lessonId: string): Promise<Material[]> {
    return this.model.findMany({
      where: { lessonId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async countByLessonId(lessonId: string): Promise<number> {
    return this.model.count({ where: { lessonId } });
  }

  async deleteByLessonId(lessonId: string): Promise<void> {
    await this.model.deleteMany({ where: { lessonId } });
  }
}
