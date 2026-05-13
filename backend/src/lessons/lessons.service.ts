import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { LessonRepository, SectionRepository, EnrollmentRepository } from '../database/repositories';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { RequestUser } from '../shared/helpers/course-content-access.helper';

@Injectable()
export class LessonsService {
  constructor(
    private readonly lessonRepository: LessonRepository,
    private readonly sectionRepository: SectionRepository,
    private readonly enrollmentRepository: EnrollmentRepository,
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

  /**
   * List lessons by section — returns titles only to unauthenticated users on published courses.
   */
  async findAll(sectionId?: string, user?: RequestUser) {
    if (sectionId) {
      const section = await this.sectionRepository.findByIdWithCourse(sectionId);
      if (section) {
        const course = section.course;
        const isAdmin = user?.role === 'admin';
        const isAuthor = user?.role === 'teacher' && course.authorId === user.id;

        if (course.status !== 'published' && !isAdmin && !isAuthor) {
          throw new ForbiddenException('Course is not available');
        }
      }

      return this.lessonRepository.findMany({
        where: { sectionId },
        orderBy: { order: 'asc' },
      });
    }

    // No sectionId — admin only bulk list
    if (user?.role !== 'admin') {
      throw new ForbiddenException('Specify a sectionId or authenticate as admin');
    }

    return this.lessonRepository.findMany({ orderBy: { order: 'asc' } });
  }

  /**
   * Get single lesson — requires JWT.
   * - Admin: always allowed
   * - Teacher who authored the course: allowed
   * - Student: must be actively enrolled
   */
  async findOne(id: string, user: { id: string; role: string }) {
    const lesson = await this.lessonRepository.findByIdWithSection(id);
    if (!lesson) throw new NotFoundException('Lesson not found');

    const course = lesson.section?.course;
    if (!course) throw new NotFoundException('Course not found');

    const isAdmin = user.role === 'admin';
    const isAuthor = user.role === 'teacher' && course.authorId === user.id;

    if (!isAdmin && !isAuthor) {
      // Must be enrolled
      const enrollment = await this.enrollmentRepository.findByUserAndCourse(user.id, course.id);
      if (!enrollment || enrollment.status !== 'active') {
        throw new ForbiddenException('You must be enrolled in this course to access lessons');
      }
    }

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
