import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { MaterialRepository, LessonRepository, EnrollmentRepository } from '../database/repositories';
import { CreateMaterialDto, UpdateMaterialDto } from './dto';

type AccessUser = { id: string; role: string };

@Injectable()
export class MaterialsService {
  constructor(
    private readonly materialRepository: MaterialRepository,
    private readonly lessonRepository: LessonRepository,
    private readonly enrollmentRepository: EnrollmentRepository,
  ) {}

  private async getLessonWithCourse(lessonId: string) {
    const lesson = await this.lessonRepository.findByIdWithSection(lessonId);
    if (!lesson) throw new NotFoundException('Lesson not found');
    return lesson;
  }

  /** Verify user can read lesson content (admin, course-author, or enrolled student). */
  private async assertReadAccess(courseId: string, courseAuthorId: string, user: AccessUser) {
    if (user.role === 'admin') return;
    if (user.role === 'teacher' && courseAuthorId === user.id) return;

    const enrollment = await this.enrollmentRepository.findByUserAndCourse(user.id, courseId);
    if (!enrollment || enrollment.status !== 'active') {
      throw new ForbiddenException('You must be enrolled to access materials');
    }
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

  async findByLessonId(lessonId: string, user: AccessUser) {
    const lesson = await this.getLessonWithCourse(lessonId);
    await this.assertReadAccess(lesson.section.course.id, lesson.section.course.authorId, user);
    return this.materialRepository.findByLessonId(lessonId);
  }

  async findOne(id: string, user: AccessUser) {
    const material = await this.materialRepository.findById(id);
    if (!material) throw new NotFoundException('Material not found');

    const lesson = await this.getLessonWithCourse(material.lessonId);
    await this.assertReadAccess(lesson.section.course.id, lesson.section.course.authorId, user);

    return material;
  }

  async update(id: string, dto: UpdateMaterialDto, authorId: string) {
    const material = await this.materialRepository.findById(id);
    if (!material) throw new NotFoundException('Material not found');

    const lesson = await this.getLessonWithCourse(material.lessonId);

    if (lesson.section.course.authorId !== authorId) {
      throw new ForbiddenException('You can only update materials in your own lessons');
    }

    return this.materialRepository.update(id, dto);
  }

  async remove(id: string, authorId: string) {
    const material = await this.materialRepository.findById(id);
    if (!material) throw new NotFoundException('Material not found');

    const lesson = await this.getLessonWithCourse(material.lessonId);

    if (lesson.section.course.authorId !== authorId) {
      throw new ForbiddenException('You can only delete materials from your own lessons');
    }

    return this.materialRepository.delete(id);
  }
}
