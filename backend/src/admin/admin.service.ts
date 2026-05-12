import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { OnApplicationBootstrap } from '@nestjs/common';
import {
  UserRepository,
  CourseRepository,
  OrderRepository,
  LessonRepository,
  SectionRepository,
  AdminRepository,
} from '../database/repositories';
import { PasswordService } from '../auth/services/password.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { CreateCourseDto } from '../courses/dto/create-course.dto';
import { CreateLessonDto } from '../lessons/dto/create-lesson.dto';
import { PaginationQueryDto } from '../shared/dto';

@Injectable()
export class AdminService implements OnApplicationBootstrap {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly courseRepository: CourseRepository,
    private readonly orderRepository: OrderRepository,
    private readonly lessonRepository: LessonRepository,
    private readonly sectionRepository: SectionRepository,
    private readonly adminRepository: AdminRepository,
    private readonly passwordService: PasswordService,
  ) {}

  /** Run after DI is fully set up — safe for async logic */
  async onApplicationBootstrap() {
    await this.createSuperAdminIfNotExists();
  }

  private async createSuperAdminIfNotExists() {
    const adminExists = await this.userRepository.findOne({ role: 'admin' });

    if (!adminExists) {
      const hashedPassword = await this.passwordService.hashPassword('Admin123!');
      await this.userRepository.createUser({
        email: 'admin@lms.com',
        password: hashedPassword,
        role: 'admin',
        firstName: 'Admin',
        username: 'admin',
      });
    }
  }

  // ─── User Management (Paginated) ──────────────────────────────────────────

  async getAllUsers(query?: PaginationQueryDto) {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    const search = query?.search;

    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search } },
        { email: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
      ];
    }

    return this.userRepository.findPaginated({
      page,
      limit,
      where,
      orderBy: { createdAt: query?.sortOrder ?? 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async createUser(createUserDto: CreateUserDto) {
    const { email, password, role, username } = createUserDto;

    const userExists = await this.userRepository.findByUsernameOrEmail(username, email);
    if (userExists) {
      throw new BadRequestException('User with this email or username already exists');
    }

    const hashedPassword = await this.passwordService.hashPassword(password);
    const user = await this.userRepository.createUser({
      email,
      password: hashedPassword,
      role: role || 'student',
      username,
    });

    const { password: _, ...result } = user;
    return result;
  }

  async updateUser(id: string, updateData: UpdateUserDto, requesterId: string) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');

    // Only allow safe fields from UpdateUserDto
    const safeData: Record<string, unknown> = {};
    if (updateData.firstName !== undefined) safeData.firstName = updateData.firstName;
    if (updateData.lastName !== undefined) safeData.lastName = updateData.lastName;
    if (updateData.email !== undefined) safeData.email = updateData.email;
    if (updateData.username !== undefined) safeData.username = updateData.username;
    if (updateData.role !== undefined) safeData.role = updateData.role;

    return this.userRepository.update(id, safeData);
  }

  async deleteUser(id: string, requesterId: string): Promise<void> {
    if (id === requesterId) {
      throw new ForbiddenException('Cannot delete your own admin account');
    }
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');

    // Check if this is the last admin
    if (user.role === 'admin') {
      const adminCount = await this.userRepository.count({ role: 'admin' });
      if (adminCount <= 1) {
        throw new ForbiddenException('Cannot delete the last admin account');
      }
    }

    // Soft delete — deactivate instead of hard delete to preserve data integrity
    await this.userRepository.update(id, { isActive: false });
  }

  async toggleUserStatus(id: string, isActive: boolean) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return this.userRepository.update(id, { isActive });
  }

  // ─── Course Management (Paginated) ────────────────────────────────────────

  async getPendingCourses(query?: PaginationQueryDto) {
    return this.courseRepository.findPaginated({
      page: query?.page ?? 1,
      limit: query?.limit ?? 20,
      where: { status: { in: ['pending', 'draft'] } },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, username: true, firstName: true } },
        _count: { select: { enrollments: true } },
      },
    });
  }

  async getAllCourses(query?: PaginationQueryDto) {
    const search = query?.search;
    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    return this.courseRepository.findPaginated({
      page: query?.page ?? 1,
      limit: query?.limit ?? 20,
      where,
      orderBy: { createdAt: query?.sortOrder ?? 'desc' },
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

    const author = await this.userRepository.findById(authorId);
    if (!author) throw new NotFoundException('Author not found');

    return this.courseRepository.createWithAuthor(
      {
        title: dto.title,
        description: dto.description,
        price: dto.price || 0,
        thumbnail: dto.thumbnail,
      },
      authorId,
    );
  }

  async updateCourse(id: string, updateData: any) {
    const course = await this.courseRepository.findById(id);
    if (!course) throw new NotFoundException('Course not found');

    if (updateData.authorId) {
      const author = await this.userRepository.findById(updateData.authorId);
      if (!author) throw new NotFoundException('Author not found');
    }

    return this.courseRepository.update(id, updateData);
  }

  async deleteCourse(id: string): Promise<void> {
    const course = await this.courseRepository.findById(id);
    if (!course) throw new NotFoundException('Course not found');
    await this.courseRepository.delete(id);
  }

  async publishCourse(id: string) {
    const course = await this.courseRepository.findById(id);
    if (!course) throw new NotFoundException('Course not found');
    if (course.status !== 'pending') {
      throw new BadRequestException(
        'Only courses pending review can be published',
      );
    }
    return this.courseRepository.update(id, { status: 'published' });
  }

  async rejectCourse(id: string) {
    const course = await this.courseRepository.findById(id);
    if (!course) throw new NotFoundException('Course not found');
    if (course.status !== 'pending') {
      throw new BadRequestException(
        'Only courses pending review can be rejected',
      );
    }
    return this.courseRepository.update(id, { status: 'draft' });
  }

  // ─── Order Management (Paginated) ─────────────────────────────────────────

  async getAllOrders(query?: PaginationQueryDto) {
    return this.orderRepository.findPaginated({
      page: query?.page ?? 1,
      limit: query?.limit ?? 20,
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

  // ─── Lesson Management (Paginated) ────────────────────────────────────────

  async getAllLessons(query?: PaginationQueryDto) {
    return this.lessonRepository.findPaginated({
      page: query?.page ?? 1,
      limit: query?.limit ?? 20,
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
    const section = await this.sectionRepository.findById(dto.sectionId);
    if (!section) throw new NotFoundException('Section not found');

    const nextOrder = await this.lessonRepository.getNextOrder(dto.sectionId);

    return this.lessonRepository.createWithOrder({
      title: dto.title,
      content: dto.content,
      videoUrl: dto.videoUrl,
      duration: dto.duration,
      sectionId: dto.sectionId,
      order: nextOrder,
    });
  }

  async updateLesson(id: string, updateData: any) {
    const lesson = await this.lessonRepository.findById(id);
    if (!lesson) throw new NotFoundException('Lesson not found');

    return this.lessonRepository.updateWithIncludes(id, updateData);
  }

  async deleteLesson(id: string): Promise<void> {
    const lesson = await this.lessonRepository.findById(id);
    if (!lesson) throw new NotFoundException('Lesson not found');
    await this.lessonRepository.delete(id);
  }

  // ─── Dashboard & Analytics ────────────────────────────────────────────────

  async getDashboardStats() {
    const [counts, recentUsers, recentCourses] = await Promise.all([
      this.adminRepository.getDashboardCounts(),
      this.adminRepository.getRecentUsers(),
      this.adminRepository.getRecentCourses(),
    ]);

    const userRoleMap = Object.fromEntries(
      counts.usersByRole.map((r) => [r.role, r._count.id]),
    );
    const courseStatusMap = Object.fromEntries(
      counts.coursesByStatus.map((r) => [r.status, r._count.id]),
    );

    return {
      users: counts.totalUsers,
      courses: counts.totalCourses,
      lessons: counts.totalLessons,
      enrollments: counts.totalEnrollments,
      revenue: counts.revenue,
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
    const months = await this.adminRepository.getMonthlyRevenue();
    const totalRevenue = months.reduce((s, m) => s + m.revenue, 0);
    return { totalRevenue, months };
  }

  /** Course stats: enrollment count, average rating */
  async getStatsCourses() {
    return this.adminRepository.getCourseStats();
  }
}
