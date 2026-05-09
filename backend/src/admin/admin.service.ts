import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from '../auth/services/password.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { CreateCourseDto } from '../courses/dto/create-course.dto';
import { CreateLessonDto } from '../lessons/dto/create-lesson.dto';

@Injectable()
export class AdminService implements OnApplicationBootstrap {
  constructor(
    private prisma: PrismaService,
    private passwordService: PasswordService,
  ) {}

  /** Run after DI is fully set up — safe for async logic */
  async onApplicationBootstrap() {
    await this.createSuperAdminIfNotExists();
  }

  private async createSuperAdminIfNotExists() {
    const adminExists = await this.prisma.user.findFirst({
      where: { role: 'admin' },
    });

    if (!adminExists) {
      const hashedPassword = await this.passwordService.hashPassword('Admin123!');
      await this.prisma.user.create({
        data: {
          email: 'admin@lms.com',
          password: hashedPassword,
          role: 'admin',
          firstName: 'Admin',
          username: 'admin',
        },
      });
    }
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async createUser(createUserDto: CreateUserDto) {
    const { email, password, role, username } = createUserDto;

    const userExists = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (userExists) {
      throw new BadRequestException('User with this email or username already exists');
    }

    const hashedPassword = await this.passwordService.hashPassword(password);
    const user = await this.prisma.user.create({
      data: { email, password: hashedPassword, role: role || 'student', username },
    });

    const { password: _, ...result } = user;
    return result;
  }

  async updateUser(id: string, updateData: UpdateUserDto, requesterId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    // Only allow safe fields from UpdateUserDto
    const safeData: Record<string, unknown> = {};
    if (updateData.firstName !== undefined) safeData.firstName = updateData.firstName;
    if (updateData.lastName !== undefined) safeData.lastName = updateData.lastName;
    if (updateData.email !== undefined) safeData.email = updateData.email;
    if (updateData.username !== undefined) safeData.username = updateData.username;
    if (updateData.role !== undefined) safeData.role = updateData.role;

    return this.prisma.user.update({ where: { id }, data: safeData });
  }

  async deleteUser(id: string, requesterId: string): Promise<void> {
    if (id === requesterId) {
      throw new ForbiddenException('Cannot delete your own admin account');
    }
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    // Check if this is the last admin
    if (user.role === 'admin') {
      const adminCount = await this.prisma.user.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        throw new ForbiddenException('Cannot delete the last admin account');
      }
    }

    // Soft delete — deactivate instead of hard delete to preserve data integrity
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async toggleUserStatus(id: string, isActive: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: { id: true, username: true, email: true, role: true, isActive: true },
    });
  }

  async getPendingCourses() {
    return this.prisma.course.findMany({
      where: { status: { in: ['pending', 'draft'] } },
      include: {
        author: { select: { id: true, username: true, firstName: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllCourses() {
    return this.prisma.course.findMany({
      include: {
        author: {
          select: { id: true, username: true, email: true, firstName: true, lastName: true },
        },
        sections: {
          include: { lessons: true },
        },
      },
    });
  }

  async createCourse(dto: CreateCourseDto) {
    const authorId = dto.authorId;
    if (!authorId) throw new BadRequestException('authorId is required');

    const author = await this.prisma.user.findUnique({ where: { id: authorId } });
    if (!author) throw new NotFoundException('Author not found');

    return this.prisma.course.create({
      data: {
        title: dto.title,
        description: dto.description,
        price: dto.price || 0,
        thumbnail: dto.thumbnail,
        authorId,
      },
      include: {
        author: {
          select: { id: true, username: true, email: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async updateCourse(id: string, updateData: any) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Course not found');

    if (updateData.authorId) {
      const author = await this.prisma.user.findUnique({ where: { id: updateData.authorId } });
      if (!author) throw new NotFoundException('Author not found');
    }

    return this.prisma.course.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: { id: true, username: true, email: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async deleteCourse(id: string): Promise<void> {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Course not found');
    await this.prisma.course.delete({ where: { id } });
  }

  async publishCourse(id: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Course not found');
    if (course.status !== 'pending') {
      throw new BadRequestException(
        'Only courses pending review can be published',
      );
    }
    return this.prisma.course.update({
      where: { id },
      data: { status: 'published' },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async rejectCourse(id: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Course not found');
    if (course.status !== 'pending') {
      throw new BadRequestException(
        'Only courses pending review can be rejected',
      );
    }
    return this.prisma.course.update({
      where: { id },
      data: { status: 'draft' },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async getAllOrders() {
    return this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, username: true, email: true },
        },
        items: {
          include: {
            course: { select: { id: true, title: true, price: true } },
          },
        },
        payment: true,
      },
    });
  }

  async getAllLessons() {
    return this.prisma.lesson.findMany({
      include: {
        section: {
          include: {
            course: { select: { id: true, title: true } },
          },
        },
      },
    });
  }

  async createLesson(dto: CreateLessonDto) {
    const section = await this.prisma.section.findUnique({ where: { id: dto.sectionId } });
    if (!section) throw new NotFoundException('Section not found');

    const maxOrder = await this.prisma.lesson.findFirst({
      where: { sectionId: dto.sectionId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    return this.prisma.lesson.create({
      data: {
        title: dto.title,
        content: dto.content,
        videoUrl: dto.videoUrl,
        duration: dto.duration,
        order: maxOrder ? maxOrder.order + 1 : 1,
        sectionId: dto.sectionId,
      },
      include: {
        section: {
          include: { course: { select: { id: true, title: true } } },
        },
      },
    });
  }

  async updateLesson(id: string, updateData: any) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new NotFoundException('Lesson not found');

    return this.prisma.lesson.update({
      where: { id },
      data: updateData,
      include: {
        section: {
          include: { course: { select: { id: true, title: true } } },
        },
      },
    });
  }

  async deleteLesson(id: string): Promise<void> {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new NotFoundException('Lesson not found');
    await this.prisma.lesson.delete({ where: { id } });
  }

  async getDashboardStats() {
    const [
      totalUsers,
      totalCourses,
      totalLessons,
      totalEnrollments,
      usersByRole,
      coursesByStatus,
      recentUsers,
      recentCourses,
      revenue,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.course.count(),
      this.prisma.lesson.count(),
      this.prisma.enrollment.count(),
      this.prisma.user.groupBy({ by: ['role'], _count: { id: true } }),
      this.prisma.course.groupBy({ by: ['status'], _count: { id: true } }),
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, username: true, email: true, role: true, createdAt: true },
      }),
      this.prisma.course.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          author: { select: { id: true, username: true } },
          _count: { select: { enrollments: true } },
        },
      }),
      this.prisma.order.aggregate({
        where: { status: { in: ['paid', 'completed'] } },
        _sum: { finalPrice: true },
      }),
    ]);

    const userRoleMap = Object.fromEntries(
      usersByRole.map((r) => [r.role, r._count.id]),
    );
    const courseStatusMap = Object.fromEntries(
      coursesByStatus.map((r) => [r.status, r._count.id]),
    );

    return {
      users: totalUsers,
      courses: totalCourses,
      lessons: totalLessons,
      enrollments: totalEnrollments,
      revenue: revenue._sum.finalPrice ?? 0,
      usersByRole: {
        student: userRoleMap['student'] ?? 0,
        teacher: userRoleMap['teacher'] ?? 0,
        parent: userRoleMap['parent'] ?? 0,
        admin: userRoleMap['admin'] ?? 0,
      },
      coursesByStatus: {
        draft: courseStatusMap['draft'] ?? 0,
        pending: courseStatusMap['pending'] ?? 0,
        published: courseStatusMap['published'] ?? 0,
      },
      recentUsers,
      recentCourses,
    };
  }

  /** Revenue stats by month (last 12 months) */
  async getStatsRevenue() {
    const now = new Date();
    const months: { month: string; revenue: number; orders: number }[] = [];

    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const label = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;

      const [agg, count] = await Promise.all([
        this.prisma.order.aggregate({
          where: { status: { in: ['paid', 'completed'] }, createdAt: { gte: start, lte: end } },
          _sum: { finalPrice: true },
        }),
        this.prisma.order.count({
          where: { status: { in: ['paid', 'completed'] }, createdAt: { gte: start, lte: end } },
        }),
      ]);

      months.push({ month: label, revenue: agg._sum.finalPrice ?? 0, orders: count });
    }

    const totalRevenue = months.reduce((s, m) => s + m.revenue, 0);
    return { totalRevenue, months };
  }

  /** Course stats: enrollment count, average rating */
  async getStatsCourses() {
    const courses = await this.prisma.course.findMany({
      include: {
        author: { select: { id: true, username: true, firstName: true } },
        _count: { select: { enrollments: true, reviews: true } },
        reviews: { select: { rating: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return courses.map(c => ({
      id: c.id,
      title: c.title,
      status: c.status,
      author: c.author,
      enrollments: c._count.enrollments,
      reviewCount: c._count.reviews,
      avgRating: c.reviews.length > 0
        ? +(c.reviews.reduce((s, r) => s + r.rating, 0) / c.reviews.length).toFixed(1)
        : null,
      createdAt: c.createdAt,
    }));
  }
}
