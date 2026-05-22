import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { OnApplicationBootstrap } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Queue } from 'bull';
import {
  UserRepository,
  CourseRepository,
  OrderRepository,
  LessonRepository,
  SectionRepository,
  AdminRepository,
  NotificationRepository,
} from '../database/repositories';
import { PasswordService } from '../auth/services/password.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { CreateCourseDto } from '../courses/dto/create-course.dto';
import { CreateLessonDto } from '../lessons/dto/create-lesson.dto';
import { PaginationQueryDto } from '../shared/dto';
import { QueueNames } from '../shared/queues';

@Injectable()
export class AdminService implements OnApplicationBootstrap {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly courseRepository: CourseRepository,
    private readonly orderRepository: OrderRepository,
    private readonly lessonRepository: LessonRepository,
    private readonly sectionRepository: SectionRepository,
    private readonly adminRepository: AdminRepository,
    private readonly notificationRepository: NotificationRepository,
    private readonly passwordService: PasswordService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    @InjectQueue(QueueNames.EMAIL) private readonly emailQueue: Queue,
    @InjectQueue(QueueNames.NOTIFICATION) private readonly notificationQueue: Queue,
    @InjectQueue(QueueNames.VIDEO) private readonly videoQueue: Queue,
    @InjectQueue(QueueNames.WALLET) private readonly walletQueue: Queue,
  ) {}

  /** Run after DI is fully set up — safe for async logic */
  async onApplicationBootstrap() {
    await this.bootstrapAdminFromEnv();
  }

  /**
   * Bootstrap a super-admin from environment variables.
   * Requires BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_USERNAME,
   * and BOOTSTRAP_ADMIN_PASSWORD to be set.
   * Does nothing if any variable is missing (safe for production).
   * Does nothing if an admin already exists.
   */
  private async bootstrapAdminFromEnv() {
    const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
    const username = process.env.BOOTSTRAP_ADMIN_USERNAME;
    const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

    if (!email || !username || !password) {
      return; // No env vars set — skip silently
    }

    const adminExists = await this.userRepository.findOne({ role: 'admin' });
    if (adminExists) return; // Already bootstrapped

    const hashedPassword = await this.passwordService.hashPassword(password);
    await this.userRepository.createUser({
      email,
      password: hashedPassword,
      role: 'admin',
      username,
    });

    // NOTE: Never log the password
    console.log(`[Bootstrap] Admin user '${username}' created from env vars.`);
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
    const { email, password, role, username, firstName, lastName } = createUserDto as any;

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
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
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

    if (user.role === 'admin' && safeData.role && safeData.role !== 'admin') {
      const activeAdminCount = await this.userRepository.count({ role: 'admin', isActive: true });
      if (activeAdminCount <= 1) {
        throw new ForbiddenException('Cannot remove the last active admin role');
      }
    }

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
    if (user.role === 'admin' && user.isActive && !isActive) {
      const activeAdminCount = await this.userRepository.count({ role: 'admin', isActive: true });
      if (activeAdminCount <= 1) {
        throw new ForbiddenException('Cannot deactivate the last active admin account');
      }
    }
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

    const result = await this.courseRepository.update(id, updateData);
    await this.invalidateCourseCaches(id);
    return result;
  }

  async deleteCourse(id: string): Promise<void> {
    const course = await this.courseRepository.findById(id);
    if (!course) throw new NotFoundException('Course not found');
    await this.courseRepository.delete(id);
    await this.invalidateCourseCaches(id);
  }

  async publishCourse(id: string) {
    const course = await this.courseRepository.findById(id);
    if (!course) throw new NotFoundException('Course not found');
    if (course.status !== 'pending') {
      throw new BadRequestException(
        'Only courses pending review can be published',
      );
    }
    const result = await this.courseRepository.update(id, { status: 'published' });
    await this.invalidateCourseCaches(id);
    return result;
  }

  async rejectCourse(id: string, reason?: string) {
    const course = await this.courseRepository.findById(id);
    if (!course) throw new NotFoundException('Course not found');
    if (course.status !== 'pending') {
      throw new BadRequestException(
        'Only courses pending review can be rejected',
      );
    }
    const result = await this.courseRepository.update(id, { status: 'draft' });
    await this.invalidateCourseCaches(id);

    // Notify the course author about the rejection
    if (course.authorId) {
      const reasonText = reason?.trim() || 'Không có lý do cụ thể';
      await this.notificationRepository.create({
        userId: course.authorId,
        title: `Khóa học "${course.title}" bị từ chối`,
        message: `Khóa học của bạn đã bị từ chối duyệt. Lý do: ${reasonText}. Vui lòng chỉnh sửa và gửi lại.`,
        type: 'course_rejected',
      }).catch(() => undefined);
    }

    return result;
  }

  private async invalidateCourseCaches(courseId?: string) {
    await this.cache.del('courses:public:all');
    if (courseId) {
      await this.cache.del(`courses:public:detail:${courseId}`);
    }
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
      mediaAssetId: dto.mediaAssetId,
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

  async getQueueHealth() {
    const queues = this.getQueueMap();
    const entries = await Promise.all(
      Object.entries(queues).map(async ([name, queue]) => ({
        name,
        counts: await queue.getJobCounts(),
      })),
    );
    return entries;
  }

  async getFailedJobs(queueName: string, limit = 20) {
    const queue = this.getQueueMap()[queueName];
    if (!queue) {
      throw new BadRequestException(`Unknown queue: ${queueName}`);
    }

    const jobs = await queue.getFailed(0, Math.max(0, limit - 1));
    return jobs.map((job) => ({
      id: job.id,
      name: job.name,
      data: job.data,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
    }));
  }

  private getQueueMap(): Record<string, Queue> {
    return {
      [QueueNames.EMAIL]: this.emailQueue,
      [QueueNames.NOTIFICATION]: this.notificationQueue,
      [QueueNames.VIDEO]: this.videoQueue,
      [QueueNames.WALLET]: this.walletQueue,
    };
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

  async getStatsRevenueDetail() {
    return this.adminRepository.getRevenueDetails();
  }

  async getRefundRequests() {
    return this.adminRepository.listRefundRequests();
  }

  async markRefundPaid(id: string, adminId: string, bankTransferRef?: string) {
    const transferRef = bankTransferRef?.trim();
    if (!transferRef) {
      throw new BadRequestException('bankTransferRef is required to confirm a refund');
    }
    const result = await this.adminRepository.markRefundPaid(id, adminId, transferRef);
    if (!result) throw new NotFoundException('Refund request not found');
    const refund = result.refund;
    if (result.alreadyPaid) return refund;

    await this.notificationRepository.create({
      userId: refund.parentId,
      title: 'Đã hoàn tiền chuyển khoản dư',
      message: JSON.stringify({
        refundRequestId: refund.id,
        orderId: refund.orderId,
        amount: Number(refund.amount),
        bankTransferRef: refund.bankTransferRef,
      }),
      type: 'refund_paid',
    }).catch(() => undefined);
    return refund;
  }

  /** Course stats: enrollment count, average rating */
  async getStatsCourses() {
    return this.adminRepository.getCourseStats();
  }
}
