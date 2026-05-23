import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CourseRepository, EnrollmentRepository } from '../database/repositories';
import { WalletRepository } from '../database/repositories';
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
    private readonly walletRepository: WalletRepository,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async create(dto: CreateCourseDto, authorId: string, role?: string) {
    // Only admin can set status directly — teachers always start as draft
    const status = role === 'admin' && dto.status ? dto.status : 'draft';
    const result = await this.courseRepository.createWithAuthor(
      { ...dto, status },
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

  async remove(id: string, user: { id: string; role: string }) {
    const course = await this.courseRepository.findById(id);
    if (!course) throw new NotFoundException('Course not found');
    const isAdmin = user.role === 'admin';
    if (course.authorId !== user.id && !isAdmin)
      throw new ForbiddenException('You can only delete your own courses');
    if (course.status !== 'draft' && !isAdmin)
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
    const [courses, enrollments, reviews, revenue, recentEnrollments, receivedPayments] =
      await this.courseRepository.getTeacherStatsData(authorId);

    const wallet = await this.walletRepository.findWithTransactions(authorId, 1000);
    const earningTransactions = (wallet?.transactions || []).filter(
      (transaction: any) => transaction.type === 'EARNING',
    );
    const teacherRevenue = Number(wallet?.totalEarned || 0);
    const grossRevenue = revenue.reduce((sum, item) => sum + Number(item.price), 0);
    const totalRevenue = teacherRevenue;

    const totalStudents = new Set(enrollments.map((e) => e.userId)).size;
    const avgRating = reviews.length
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;
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

    earningTransactions.forEach((transaction: any) => {
      if (!transaction.createdAt) return;
      const d = new Date(transaction.createdAt);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const month = monthlyData.find(m => m.yearMonth === ym);
      if (month) month.revenue += Number(transaction.amount || 0);
    });

    enrollments.forEach(item => {
      if (!item.createdAt) return;
      const d = new Date(item.createdAt);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const month = monthlyData.find(m => m.yearMonth === ym);
      if (month) month.enrollments += 1;
    });

    const revenueByCourse = new Map<string, { revenue: number; paidStudents: number }>();
    revenue.forEach((item: any) => {
      const current = revenueByCourse.get(item.courseId) || { revenue: 0, paidStudents: 0 };
      current.revenue += Number(item.price || 0);
      current.paidStudents += 1;
      revenueByCourse.set(item.courseId, current);
    });

    const teacherRevenueByCourse = new Map<string, number>();
    earningTransactions.forEach((transaction: any) => {
      const courseId = transaction.idempotencyKey?.split(':')?.[2];
      if (!courseId) return;
      teacherRevenueByCourse.set(
        courseId,
        (teacherRevenueByCourse.get(courseId) || 0) + Number(transaction.amount || 0),
      );
    });

    const enrollmentsByCourse = new Map<string, any[]>();
    enrollments.forEach((enrollment: any) => {
      if (!enrollmentsByCourse.has(enrollment.courseId)) enrollmentsByCourse.set(enrollment.courseId, []);
      enrollmentsByCourse.get(enrollment.courseId)!.push(enrollment);
    });

    const courseBreakdown = courses.map((course: any) => {
      const courseEnrollments = enrollmentsByCourse.get(course.id) || [];
      const uniqueStudents = Array.from(new Map(courseEnrollments.map((e: any) => [e.userId, e])).values());
      return {
        id: course.id,
        title: course.title,
        status: course.status,
        price: Number(course.price || 0),
        students: uniqueStudents.map((e: any) => ({
          enrollmentId: e.id,
          status: e.status,
          enrolledAt: e.createdAt,
          user: e.user,
        })),
        studentCount: uniqueStudents.length,
        revenue: teacherRevenueByCourse.get(course.id) || 0,
        teacherRevenue: teacherRevenueByCourse.get(course.id) || 0,
        grossRevenue: revenueByCourse.get(course.id)?.revenue || 0,
        paidStudents: revenueByCourse.get(course.id)?.paidStudents || 0,
      };
    });

    return {
      totalCourses: courses.length,
      publishedCourses,
      draftCourses,
      totalStudents,
      totalRevenue,
      teacherRevenue,
      grossRevenue,
      avgRating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length,
      recentEnrollments,
      monthlyData,
      courseBreakdown,
      revenueSource: 'wallet_earnings',
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
