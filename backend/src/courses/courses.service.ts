import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CourseRepository } from '../database/repositories';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CoursesService {
  constructor(
    private readonly courseRepository: CourseRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateCourseDto, authorId: string) {
    return this.courseRepository.createWithAuthor(
      { ...dto, status: 'draft' },
      authorId,
    );
  }

  async findAll() {
    return this.courseRepository.findAllWithCounts({ status: 'published' });
  }

  async findOne(
    id: string,
    viewer?: { id: string; role: string } | null,
  ) {
    const course = await this.courseRepository.findByIdWithSections(id);
    if (!course) throw new NotFoundException('Course not found');
    if (course.status === 'published') return course;
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
    return this.courseRepository.update(id, payload as UpdateCourseDto);
  }

  async remove(id: string, authorId: string) {
    const course = await this.courseRepository.findById(id);
    if (!course) throw new NotFoundException('Course not found');
    if (course.authorId !== authorId)
      throw new ForbiddenException('You can only delete your own courses');
    return this.courseRepository.delete(id);
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
    const [courses, enrollments, reviews, revenue, recentEnrollments] = await Promise.all([
      this.prisma.course.findMany({
        where: { authorId },
        include: { _count: { select: { enrollments: true } } },
      }),
      this.prisma.enrollment.findMany({
        where: { course: { authorId } },
        select: { userId: true },
      }),
      this.prisma.review.findMany({
        where: { course: { authorId } },
        select: { rating: true },
      }),
      this.prisma.orderItem.findMany({
        where: {
          order: { status: { in: ['paid', 'completed'] } },
          course: { authorId },
        },
        select: { price: true },
      }),
      this.prisma.enrollment.findMany({
        where: { course: { authorId } },
        include: {
          user: { select: { id: true, username: true } },
          course: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const totalStudents = new Set(enrollments.map((e) => e.userId)).size;
    const avgRating = reviews.length
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;
    const totalRevenue = revenue.reduce((sum, item) => sum + item.price, 0);
    const publishedCourses = courses.filter((c) => c.status === 'published').length;
    const draftCourses = courses.filter((c) => c.status === 'draft').length;

    return {
      totalCourses: courses.length,
      publishedCourses,
      draftCourses,
      totalStudents,
      totalRevenue,
      avgRating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length,
      recentEnrollments,
    };
  }
}
