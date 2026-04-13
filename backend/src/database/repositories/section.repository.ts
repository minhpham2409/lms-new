import { Injectable } from '@nestjs/common';
import { Section } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseRepository } from './base.repository';

@Injectable()
export class SectionRepository extends BaseRepository<Section> {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  get model() {
    return this.prisma.section;
  }

  async findByCourseId(courseId: string): Promise<Section[]> {
    return this.model.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async findByIdWithLessons(id: string) {
    return this.model.findUnique({
      where: { id },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async getNextOrder(courseId: string): Promise<number> {
    const lastSection = await this.model.findFirst({
      where: { courseId },
      orderBy: { order: 'desc' },
    });
    return lastSection ? lastSection.order + 1 : 1;
  }

  async reorderSections(courseId: string, sectionOrders: { id: string; order: number }[]): Promise<void> {
    await this.prisma.$transaction(
      sectionOrders.map(({ id, order }) =>
        this.model.update({
          where: { id },
          data: { order },
        })
      )
    );
  }

  async countByCourseId(courseId: string): Promise<number> {
    return this.model.count({ where: { courseId } });
  }
}
