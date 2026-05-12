import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { LessonRepository, SectionRepository } from '../database/repositories';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@Injectable()
export class LessonsService {
  constructor(
    private readonly lessonRepository: LessonRepository,
    private readonly sectionRepository: SectionRepository,
  ) {}

  private async getSectionWithCourse(sectionId: string) {
    const section = await this.sectionRepository.findByIdWithCourse(sectionId);
    if (!section) throw new NotFoundException('Section not found');
    return section;
  }

  async create(data: CreateLessonDto, authorId: string) {
    const section = await this.getSectionWithCourse(data.sectionId);
    if (section.course.authorId !== authorId) {
      throw new ForbiddenException('You can only add lessons to your own sections');
    }

    const nextOrder = await this.lessonRepository.getNextOrder(data.sectionId);

    return this.lessonRepository.createWithOrder({
      title: data.title,
      content: data.content,
      videoUrl: data.videoUrl,
      duration: data.duration,
      sectionId: data.sectionId,
      order: nextOrder,
    });
  }

  async findAll(sectionId?: string) {
    if (sectionId) {
      return this.lessonRepository.findMany({
        where: { sectionId },
        orderBy: { order: 'asc' },
      });
    }
    return this.lessonRepository.findMany({ orderBy: { order: 'asc' } });
  }

  async findOne(id: string) {
    const lesson = await this.lessonRepository.findById(id);
    if (!lesson) throw new NotFoundException('Lesson not found');
    return lesson;
  }

  async update(id: string, data: UpdateLessonDto, authorId: string) {
    const lesson = await this.lessonRepository.findByIdWithSection(id);
    if (!lesson) throw new NotFoundException('Lesson not found');
    if (lesson.section.course.authorId !== authorId) {
      throw new ForbiddenException('You can only update lessons in your own courses');
    }
    return this.lessonRepository.update(id, data);
  }

  async remove(id: string, authorId: string) {
    const lesson = await this.lessonRepository.findByIdWithSection(id);
    if (!lesson) throw new NotFoundException('Lesson not found');
    if (lesson.section.course.authorId !== authorId) {
      throw new ForbiddenException('You can only delete lessons in your own courses');
    }
    return this.lessonRepository.delete(id);
  }
}
