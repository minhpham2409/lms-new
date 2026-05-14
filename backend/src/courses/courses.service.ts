import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CourseRepository, EnrollmentRepository } from '../database/repositories';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

const CACHE_KEY_ALL_COURSES = 'courses:public:all';
const CACHE_KEY_PUBLIC_COURSE_PREFIX = 'courses:public:detail:';
const CACHE_TTL = 60_000; // 60 seconds in ms

@Injectable()
export class CoursesService {
  constructor(
    private readonly courseRepository: CourseRepository,
    private readonly enrollmentRepository: EnrollmentRepository,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async create(dto: CreateCourseDto, authorId: string) {
    const result = await this.courseRepository.createWithAuthor(
      { ...dto, status: dto.status ?? 'draft' },
      authorId,
    );
    await this.invalidateCourseCaches();
    return result;
  }

  async findAll() {
    const cached = await this.cache.get(CACHE_KEY_ALL_COURSES);
    if (cached) return cached;
    const result = await this.courseRepository.findAllWithCounts({ status: 'published' });
    await this.cache.set(CACHE_KEY_ALL_COURSES, result, CACHE_TTL);
    return result;
  }

  async findOne(
    id: string,
    viewer?: { id: string; role: string } | null,
  ) {
    const course = await this.courseRepository.findByIdWithSections(id);
    if (!course) throw new NotFoundException('Course not found');
    if (course.status === 'published') {
      const hasFullAccess = await this.hasFullCourseAccess(course, viewer);
      if (hasFullAccess) return course;

      const cacheKey = `${CACHE_KEY_PUBLIC_COURSE_PREFIX}${id}`;
      const cached = await this.cache.get(cacheKey);
      if (cached) return cached;

      const publicCourse = this.toPublicCourseDetail(course);
      await this.cache.set(cacheKey, publicCourse, CACHE_TTL);
      return publicCourse;
    }
    if (
      viewer &&
      (course.authorId === viewer.id || viewer.role === 'admin')
    ) {
      return course;
    }
    throw new NotFoundException('Course not found');
  }

  async update(
    id: string,
    dto: UpdateCourseDto,
    user: { id: string; role: string },
  ) {
    const course = await this.courseRepository.findById(id);
    if (!course) throw new NotFoundException('Course not found');
    const isOwner = course.authorId === user.id;
    const isAdmin = user.role === 'admin';
    if (!isOwner && !isAdmin)
      throw new ForbiddenException('You can only update your own courses');

    const payload = { ...dto } as Record<string, unknown>;
    if (!isAdmin) {
      delete payload.status;
    }
    return this.courseRepository.update(id, payload as UpdateCourseDto).then(async (result) => {
      await this.invalidateCourseCaches(id);
      return result;
    });
  }

  async remove(id: string, authorId: string) {
    const course = await this.courseRepository.findById(id);
    if (!course) throw new NotFoundException('Course not found');
    if (course.authorId !== authorId)
      throw new ForbiddenException('You can only delete your own courses');
    if (course.status !== 'draft')
      throw new ForbiddenException('Only draft courses can be deleted');
    const result = await this.courseRepository.delete(id);
    await this.invalidateCourseCaches(id);
    return result;
  }

  async findByAuthor(authorId: string) {
    return this.courseRepository.findByAuthorId(authorId);
  }

  async search(q: string) {
    return this.courseRepository.search(q);
  }

  async submitForReview(id: string, authorId: string) {
    const course = await this.courseRepository.findById(id);
    if (!course) throw new NotFoundException('Course not found');
    if (course.authorId !== authorId)
      throw new ForbiddenException('You can only submit your own courses');
    if (course.status !== 'draft')
      throw new ForbiddenException(
        'Only draft courses can be submitted for review',
      );
    return this.courseRepository.update(id, { status: 'pending' });
  }

  async getTeacherStats(authorId: string) {
    const [courses, enrollments, reviews, revenue, recentEnrollments] =
      await this.courseRepository.getTeacherStatsData(authorId);

    const totalStudents = new Set(enrollments.map((e) => e.userId)).size;
    const avgRating = reviews.length
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;
    const totalRevenue = revenue.reduce((sum, item) => sum + Number(item.price), 0);
    const publishedCourses = courses.filter((c) => c.status === 'published').length;
    const draftCourses = courses.filter((c) => c.status === 'draft').length;

    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return {
        month: d.toLocaleString('vi-VN', { month: 'short' }) + ' ' + d.getFullYear(),
        revenue: 0,
        enrollments: 0,
        yearMonth: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      };
    }).reverse();

    revenue.forEach(item => {
      if (!item.order?.createdAt) return;
      const d = new Date(item.order.createdAt);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const month = monthlyData.find(m => m.yearMonth === ym);
      if (month) month.revenue += Number(item.price);
    });

    enrollments.forEach(item => {
      if (!item.createdAt) return;
      const d = new Date(item.createdAt);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const month = monthlyData.find(m => m.yearMonth === ym);
      if (month) month.enrollments += 1;
    });

    return {
      totalCourses: courses.length,
      publishedCourses,
      draftCourses,
      totalStudents,
      totalRevenue,
      avgRating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length,
      recentEnrollments,
      monthlyData,
    };
  }

  /** Invalidate all course-related caches */
  private async invalidateCourseCaches(courseId?: string): Promise<void> {
    await this.cache.del(CACHE_KEY_ALL_COURSES);
    if (courseId) {
      await this.cache.del(`${CACHE_KEY_PUBLIC_COURSE_PREFIX}${courseId}`);
    }
  }

  private async hasFullCourseAccess(
    course: { id: string; authorId: string },
    viewer?: { id: string; role: string } | null,
  ): Promise<boolean> {
    if (!viewer) return false;
    if (viewer.role === 'admin') return true;
    if (viewer.role === 'teacher' && course.authorId === viewer.id) return true;

    const enrollment = await this.enrollmentRepository.findByUserAndCourse(viewer.id, course.id);
    return enrollment?.status === 'active';
  }

  private toPublicCourseDetail(course: any) {
    return {
      ...course,
      sections: course.sections?.map((section: any) => ({
        ...section,
        lessons: section.lessons?.map((lesson: any) => ({
          id: lesson.id,
          title: lesson.title,
          order: lesson.order,
          duration: lesson.duration,
          sectionId: lesson.sectionId,
          createdAt: lesson.createdAt,
          updatedAt: lesson.updatedAt,
        })),
      })),
    };
  }
}
