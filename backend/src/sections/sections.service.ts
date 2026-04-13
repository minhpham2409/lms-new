import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { SectionRepository } from '../database/repositories';
import { CreateSectionDto, UpdateSectionDto, ReorderSectionsDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SectionsService {
  constructor(
    private readonly sectionRepository: SectionRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(createSectionDto: CreateSectionDto, authorId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: createSectionDto.courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.authorId !== authorId) {
      throw new ForbiddenException('You can only add sections to your own courses');
    }

    const order = createSectionDto.order || await this.sectionRepository.getNextOrder(createSectionDto.courseId);

    return this.sectionRepository.create({
      title: createSectionDto.title,
      description: createSectionDto.description,
      courseId: createSectionDto.courseId,
      order,
    });
  }

  async findByCourseId(courseId: string) {
    return this.sectionRepository.findByCourseId(courseId);
  }

  async findOne(id: string) {
    const section = await this.sectionRepository.findByIdWithLessons(id);
    if (!section) {
      throw new NotFoundException('Section not found');
    }
    return section;
  }

  async update(id: string, updateSectionDto: UpdateSectionDto, authorId: string) {
    const section = await this.sectionRepository.findById(id);
    if (!section) {
      throw new NotFoundException('Section not found');
    }

    const course = await this.prisma.course.findUnique({
      where: { id: section.courseId },
    });

    if (course.authorId !== authorId) {
      throw new ForbiddenException('You can only update sections in your own courses');
    }

    return this.sectionRepository.update(id, updateSectionDto);
  }

  async remove(id: string, authorId: string) {
    const section = await this.sectionRepository.findById(id);
    if (!section) {
      throw new NotFoundException('Section not found');
    }

    const course = await this.prisma.course.findUnique({
      where: { id: section.courseId },
    });

    if (course.authorId !== authorId) {
      throw new ForbiddenException('You can only delete sections from your own courses');
    }

    return this.sectionRepository.delete(id);
  }

  async reorder(courseId: string, reorderDto: ReorderSectionsDto, authorId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.authorId !== authorId) {
      throw new ForbiddenException('You can only reorder sections in your own courses');
    }

    const sectionCount = await this.sectionRepository.countByCourseId(courseId);
    if (reorderDto.sections.length !== sectionCount) {
      throw new BadRequestException('All sections must be included in reorder');
    }

    await this.sectionRepository.reorderSections(courseId, reorderDto.sections);

    return { message: 'Sections reordered successfully' };
  }
}
