import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { SectionRepository, CourseRepository } from '../database/repositories';
import { CreateSectionDto, UpdateSectionDto, ReorderSectionsDto } from './dto';
import { RequestUser } from '../shared/helpers/course-content-access.helper';

type WriteUser = { id: string; role: string };

@Injectable()
export class SectionsService {
  constructor(
    private readonly sectionRepository: SectionRepository,
    private readonly courseRepository: CourseRepository,
  ) {}

  /** Admin can manage all; teacher only their own course. */
  private assertWriteAccess(courseAuthorId: string, user: WriteUser) {
    if (user.role === 'admin') return;
    if (courseAuthorId !== user.id) {
      throw new ForbiddenException('You can only manage sections in your own courses');
    }
  }

  async create(createSectionDto: CreateSectionDto, user: WriteUser) {
    const course = await this.courseRepository.findById(createSectionDto.courseId);

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    this.assertWriteAccess(course.authorId, user);

    const order = createSectionDto.order || await this.sectionRepository.getNextOrder(createSectionDto.courseId);

    return this.sectionRepository.create({
      title: createSectionDto.title,
      description: createSectionDto.description,
      courseId: createSectionDto.courseId,
      order,
    });
  }

  /**
   * List sections by course. 
   * - Admin and course author: always allowed.
   * - Published course: section titles returned to anyone.
   * - Draft/pending course: only teacher-author or admin.
   */
  async findByCourseId(courseId: string, user: RequestUser) {
    const course = await this.courseRepository.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');

    const isAdmin = user?.role === 'admin';
    const isAuthor = user?.role === 'teacher' && course.authorId === user.id;

    if (course.status !== 'published' && !isAdmin && !isAuthor) {
      throw new ForbiddenException('Course is not available');
    }

    return this.sectionRepository.findByCourseId(courseId);
  }

  async findOne(id: string, user: RequestUser) {
    const section = await this.sectionRepository.findByIdWithLessons(id);
    if (!section) {
      throw new NotFoundException('Section not found');
    }

    const course = await this.courseRepository.findById(section.courseId);
    const isAdmin = user?.role === 'admin';
    const isAuthor = user?.role === 'teacher' && course?.authorId === user.id;

    if (course?.status !== 'published' && !isAdmin && !isAuthor) {
      throw new ForbiddenException('Course is not available');
    }

    return section;
  }

  async update(id: string, updateSectionDto: UpdateSectionDto, user: WriteUser) {
    const section = await this.sectionRepository.findById(id);
    if (!section) {
      throw new NotFoundException('Section not found');
    }

    const course = await this.courseRepository.findById(section.courseId);
    this.assertWriteAccess(course.authorId, user);

    return this.sectionRepository.update(id, updateSectionDto);
  }

  async remove(id: string, user: WriteUser) {
    const section = await this.sectionRepository.findById(id);
    if (!section) {
      throw new NotFoundException('Section not found');
    }

    const course = await this.courseRepository.findById(section.courseId);
    this.assertWriteAccess(course.authorId, user);

    return this.sectionRepository.delete(id);
  }

  async reorder(courseId: string, reorderDto: ReorderSectionsDto, user: WriteUser) {
    const course = await this.courseRepository.findById(courseId);

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    this.assertWriteAccess(course.authorId, user);

    const sectionCount = await this.sectionRepository.countByCourseId(courseId);
    if (reorderDto.sections.length !== sectionCount) {
      throw new BadRequestException('All sections must be included in reorder');
    }

    await this.sectionRepository.reorderSections(courseId, reorderDto.sections);

    return { message: 'Sections reordered successfully' };
  }
}
