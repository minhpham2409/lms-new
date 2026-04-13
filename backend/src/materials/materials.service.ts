import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { MaterialRepository } from '../database/repositories';
import { CreateMaterialDto, UpdateMaterialDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MaterialsService {
  constructor(
    private readonly materialRepository: MaterialRepository,
    private readonly prisma: PrismaService,
  ) {}

  private async getLessonWithCourse(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        section: {
          include: { course: true },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    return lesson;
  }

  async create(dto: CreateMaterialDto, authorId: string) {
    const lesson = await this.getLessonWithCourse(dto.lessonId);

    if (lesson.section.course.authorId !== authorId) {
      throw new ForbiddenException('You can only add materials to your own lessons');
    }

    return this.materialRepository.create({
      title: dto.title,
      description: dto.description,
      fileUrl: dto.fileUrl,
      fileType: dto.fileType,
      fileSize: dto.fileSize,
      lessonId: dto.lessonId,
    });
  }

  async findByLessonId(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    return this.materialRepository.findByLessonId(lessonId);
  }

  async findOne(id: string) {
    const material = await this.materialRepository.findById(id);

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    return material;
  }

  async update(id: string, dto: UpdateMaterialDto, authorId: string) {
    const material = await this.materialRepository.findById(id);

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    const lesson = await this.getLessonWithCourse(material.lessonId);

    if (lesson.section.course.authorId !== authorId) {
      throw new ForbiddenException('You can only update materials in your own lessons');
    }

    return this.materialRepository.update(id, dto);
  }

  async remove(id: string, authorId: string) {
    const material = await this.materialRepository.findById(id);

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    const lesson = await this.getLessonWithCourse(material.lessonId);

    if (lesson.section.course.authorId !== authorId) {
      throw new ForbiddenException('You can only delete materials from your own lessons');
    }

    return this.materialRepository.delete(id);
  }
}
