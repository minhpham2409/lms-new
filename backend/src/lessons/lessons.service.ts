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

  async create(data: CreateLessonDto, user: { id: string; role: string }) {
    const section = await this.getSectionWithCourse(data.sectionId);

    // Admin can add lessons to any course; teacher only to their own
    if (user.role !== 'admin' && section.course.authorId !== user.id) {
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
   * List lessons by section.
   * - Unauthenticated/unenrolled users on published courses: metadata only (no content/videoUrl).
   * - Admin, course author, enrolled students: full lesson data.
   */
  async findAll(sectionId?: string, user?: RequestUser) {
    if (sectionId) {
      const section = await this.sectionRepository.findByIdWithCourse(sectionId);
      if (!section) throw new NotFoundException('Section not found');

      const course = section.course;
      const isAdmin = user?.role === 'admin';
      const isAuthor = user?.role === 'teacher' && course.authorId === user.id;

      if (course.status !== 'published' && !isAdmin && !isAuthor) {
        throw new ForbiddenException('Course is not available');
      }

      const lessons = await this.lessonRepository.findMany({
        where: { sectionId },
        orderBy: { order: 'asc' },
      });

      // Check if user has full access (admin, author, or enrolled student)
      let hasFullAccess = isAdmin || isAuthor;

      if (!hasFullAccess && user) {
        const enrollment = await this.enrollmentRepository.findByUserAndCourse(user.id, course.id);
        hasFullAccess = !!enrollment && enrollment.status === 'active';
      }

      // If no full access, strip sensitive content — return metadata only
      if (!hasFullAccess) {
        return lessons.map((lesson: any) => ({
          id: lesson.id,
          title: lesson.title,
          order: lesson.order,
          duration: lesson.duration,
          sectionId: lesson.sectionId,
        }));
      }

      return lessons;
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

  async update(id: string, data: UpdateLessonDto, user: { id: string; role: string }) {
    const lesson = await this.lessonRepository.findByIdWithSection(id);
    if (!lesson) throw new NotFoundException('Lesson not found');

    // Admin can update any lesson; teacher only their own course
    if (user.role !== 'admin' && lesson.section.course.authorId !== user.id) {
      throw new ForbiddenException('You can only update lessons in your own courses');
    }
    return this.lessonRepository.update(id, data);
  }

  async remove(id: string, user: { id: string; role: string }) {
    const lesson = await this.lessonRepository.findByIdWithSection(id);
    if (!lesson) throw new NotFoundException('Lesson not found');

    // Admin can delete any lesson; teacher only their own course
    if (user.role !== 'admin' && lesson.section.course.authorId !== user.id) {
      throw new ForbiddenException('You can only delete lessons in your own courses');
    }
    return this.lessonRepository.delete(id);
  }
}
