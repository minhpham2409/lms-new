import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { LessonRepository, SectionRepository, EnrollmentRepository } from '../database/repositories';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { RequestUser } from '../shared/helpers/course-content-access.helper';

@Injectable()
export class LessonsService {
  constructor(
    private readonly lessonRepository: LessonRepository,
    private readonly sectionRepository: SectionRepository,
    private readonly enrollmentRepository: EnrollmentRepository,
    private readonly prisma: PrismaService,
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
    const media = data.mediaAssetId
      ? await this.validateLessonMediaAsset(data.mediaAssetId, user)
      : null;

    return this.lessonRepository.createWithOrder({
      title: data.title,
      content: data.content,
      videoUrl: media?.url ?? data.videoUrl,
      mediaAssetId: data.mediaAssetId,
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
    const payload = { ...data };
    if (data.mediaAssetId) {
      const media = await this.validateLessonMediaAsset(data.mediaAssetId, user, id);
      payload.videoUrl = media.url ?? payload.videoUrl;
    }
    return this.lessonRepository.update(id, payload);
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

  private async validateLessonMediaAsset(
    mediaAssetId: string,
    user: { id: string; role: string },
    currentLessonId?: string,
  ): Promise<{ id: string; ownerId: string; status: string; url: string | null }> {
    const media = await (this.prisma as any).mediaAsset.findUnique({
      where: { id: mediaAssetId },
      select: {
        id: true,
        ownerId: true,
        status: true,
        url: true,
        type: true,
        lesson: { select: { id: true } },
      },
    });

    if (!media) throw new NotFoundException('Media asset not found');
    if (media.type !== 'VIDEO') {
      throw new ForbiddenException('Only video media assets can be attached to lessons');
    }
    if (media.status !== 'READY' || !media.url) {
      throw new ForbiddenException('Media asset is not ready');
    }
    if (user.role !== 'admin' && media.ownerId !== user.id) {
      throw new ForbiddenException('You can only use your own uploaded media');
    }
    if (media.lesson && media.lesson.id !== currentLessonId) {
      throw new ForbiddenException('Media asset is already attached to another lesson');
    }

    return media;
  }
}
