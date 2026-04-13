import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LessonsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    const section = await this.prisma.section.findUnique({
      where: { id: data.sectionId },
    });

    if (!section) {
      throw new Error('Section not found');
    }

    const maxOrder = await this.prisma.lesson.findFirst({
      where: { sectionId: data.sectionId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const order = maxOrder ? maxOrder.order + 1 : 1;

    return this.prisma.lesson.create({
      data: {
        ...data,
        order,
      },
    });
  }

  async findAll(sectionId?: string) {
    if (sectionId) {
      return this.prisma.lesson.findMany({
        where: { sectionId },
        orderBy: { order: 'asc' },
      });
    }
    return this.prisma.lesson.findMany({
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.lesson.findUnique({
      where: { id: id.toString() },
    });
  }

  async update(id: number, data: any) {
    return this.prisma.lesson.update({
      where: { id: id.toString() },
      data,
    });
  }

  async remove(id: number) {
    return this.prisma.lesson.delete({
      where: { id: id.toString() },
    });
  }
}
