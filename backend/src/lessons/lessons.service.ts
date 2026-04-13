import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LessonsService {
  constructor(private prisma: PrismaService) {}

  private async getSectionWithCourse(sectionId: string) {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      include: { course: true },
    });
    if (!section) throw new NotFoundException('Section not found');
    return section;
  }

  async create(data: any, authorId: string) {
    const section = await this.getSectionWithCourse(data.sectionId);
    if (section.course.authorId !== authorId) {
      throw new ForbiddenException('You can only add lessons to your own sections');
    }

    const maxOrder = await this.prisma.lesson.findFirst({
      where: { sectionId: data.sectionId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    return this.prisma.lesson.create({
      data: { ...data, order: maxOrder ? maxOrder.order + 1 : 1 },
    });
  }

  async findAll(sectionId?: string) {
    return this.prisma.lesson.findMany({
      where: sectionId ? { sectionId } : undefined,
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: string) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new NotFoundException('Lesson not found');
    return lesson;
  }

  async update(id: string, data: any, authorId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: { section: { include: { course: true } } },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    if (lesson.section.course.authorId !== authorId) {
      throw new ForbiddenException('You can only update lessons in your own courses');
    }
    return this.prisma.lesson.update({ where: { id }, data });
  }

  async remove(id: string, authorId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: { section: { include: { course: true } } },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    if (lesson.section.course.authorId !== authorId) {
      throw new ForbiddenException('You can only delete lessons in your own courses');
    }
    return this.prisma.lesson.delete({ where: { id } });
  }
}
