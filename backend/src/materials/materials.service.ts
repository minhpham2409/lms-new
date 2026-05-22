import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { LessonRepository, EnrollmentRepository } from '../database/repositories';
import { CreateMaterialDto, UpdateMaterialDto } from './dto';
import { randomUUID } from 'crypto';

export interface MaterialItem {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

type AccessUser = { id: string; role: string };

@Injectable()
export class MaterialsService {
  constructor(
    private readonly lessonRepository: LessonRepository,
    private readonly enrollmentRepository: EnrollmentRepository,
  ) {}

  private async getLessonWithCourse(lessonId: string) {
    const lesson = await this.lessonRepository.findByIdWithSection(lessonId);
    if (!lesson) throw new NotFoundException('Lesson not found');
    return lesson;
  }

  /** Parse the JSON materials column into a typed array. */
  private parseMaterials(lesson: { materials?: any }): MaterialItem[] {
    if (!lesson.materials) return [];
    if (Array.isArray(lesson.materials)) return lesson.materials;
    try { return JSON.parse(lesson.materials); } catch { return []; }
  }

  private async assertReadAccess(courseId: string, courseAuthorId: string, user: AccessUser) {
    if (user.role === 'admin') return;
    if (user.role === 'teacher' && courseAuthorId === user.id) return;

    const enrollment = await this.enrollmentRepository.findByUserAndCourse(user.id, courseId);
    if (!enrollment || enrollment.status !== 'active') {
      throw new ForbiddenException('You must be enrolled to access materials');
    }
  }

  private assertWriteAccess(courseAuthorId: string, user: AccessUser) {
    if (user.role === 'admin') return;
    if (user.role === 'teacher' && courseAuthorId === user.id) return;
    throw new ForbiddenException('You can only manage materials in your own courses');
  }

  async create(dto: CreateMaterialDto, user: AccessUser) {
    const lesson = await this.getLessonWithCourse(dto.lessonId);
    this.assertWriteAccess(lesson.section.course.authorId, user);

    const materials = this.parseMaterials(lesson);
    const newItem: MaterialItem = {
      id: randomUUID(),
      title: dto.title,
      description: dto.description,
      fileUrl: dto.fileUrl,
      fileType: dto.fileType,
      fileSize: dto.fileSize,
    };
    materials.push(newItem);

    await this.lessonRepository.update(dto.lessonId, { materials: materials as any });
    return newItem;
  }

  async findByLessonId(lessonId: string, user: AccessUser) {
    const lesson = await this.getLessonWithCourse(lessonId);
    await this.assertReadAccess(lesson.section.course.id, lesson.section.course.authorId, user);
    return this.parseMaterials(lesson);
  }

  async findOne(id: string, user: AccessUser, lessonId?: string) {
    // We need a lessonId hint since materials are embedded in lessons
    // If not provided, we can't find it without scanning all lessons
    if (!lessonId) throw new NotFoundException('Material not found (lessonId required)');
    const lesson = await this.getLessonWithCourse(lessonId);
    await this.assertReadAccess(lesson.section.course.id, lesson.section.course.authorId, user);

    const materials = this.parseMaterials(lesson);
    const material = materials.find(m => m.id === id);
    if (!material) throw new NotFoundException('Material not found');
    return material;
  }

  async update(id: string, dto: UpdateMaterialDto, user: AccessUser) {
    if (!dto.lessonId) throw new NotFoundException('Material not found (lessonId required)');
    const lesson = await this.getLessonWithCourse(dto.lessonId);
    this.assertWriteAccess(lesson.section.course.authorId, user);

    const materials = this.parseMaterials(lesson);
    const idx = materials.findIndex(m => m.id === id);
    if (idx === -1) throw new NotFoundException('Material not found');

    if (dto.title !== undefined) materials[idx].title = dto.title;
    if (dto.description !== undefined) materials[idx].description = dto.description;
    if (dto.fileUrl !== undefined) materials[idx].fileUrl = dto.fileUrl;
    if (dto.fileType !== undefined) materials[idx].fileType = dto.fileType;
    if (dto.fileSize !== undefined) materials[idx].fileSize = dto.fileSize;

    await this.lessonRepository.update(dto.lessonId, { materials: materials as any });
    return materials[idx];
  }

  async remove(id: string, lessonId: string, user: AccessUser) {
    const lesson = await this.getLessonWithCourse(lessonId);
    this.assertWriteAccess(lesson.section.course.authorId, user);

    const materials = this.parseMaterials(lesson);
    const idx = materials.findIndex(m => m.id === id);
    if (idx === -1) throw new NotFoundException('Material not found');

    materials.splice(idx, 1);
    await this.lessonRepository.update(lessonId, { materials: materials as any });
    return { deleted: true };
  }
}
