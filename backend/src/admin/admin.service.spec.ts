import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;
  let userRepo: {
    findByUsernameOrEmail: jest.Mock;
    findById: jest.Mock;
    findOne: jest.Mock;
    createUser: jest.Mock;
    update: jest.Mock;
    count: jest.Mock;
    findPaginated: jest.Mock;
  };
  let courseRepo: {
    findById: jest.Mock;
    createWithAuthor: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    findPaginated: jest.Mock;
  };
  let orderRepo: { findPaginated: jest.Mock };
  let lessonRepo: {
    findById: jest.Mock;
    getNextOrder: jest.Mock;
    createWithOrder: jest.Mock;
    updateWithIncludes: jest.Mock;
    delete: jest.Mock;
    findPaginated: jest.Mock;
  };
  let sectionRepo: { findById: jest.Mock };
  let adminRepo: {
    getDashboardCounts: jest.Mock;
    getRecentUsers: jest.Mock;
    getRecentCourses: jest.Mock;
    getMonthlyRevenue: jest.Mock;
    getRevenueDetails: jest.Mock;
    listRefundRequests: jest.Mock;
    markRefundPaid: jest.Mock;
    getCourseStats: jest.Mock;
  };
  let notifRepo: { create: jest.Mock };
  let passwordService: { hashPassword: jest.Mock };
  let cache: { get: jest.Mock; set: jest.Mock; del: jest.Mock };

  const mockQueue = {
    add: jest.fn(),
    getJobCounts: jest.fn().mockResolvedValue({ waiting: 0, active: 0, completed: 0, failed: 0 }),
    getFailed: jest.fn().mockResolvedValue([]),
  };

  beforeEach(() => {
    userRepo = {
      findByUsernameOrEmail: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      createUser: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      findPaginated: jest.fn(),
    };
    courseRepo = {
      findById: jest.fn(),
      createWithAuthor: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findPaginated: jest.fn(),
    };
    orderRepo = { findPaginated: jest.fn() };
    lessonRepo = {
      findById: jest.fn(),
      getNextOrder: jest.fn(),
      createWithOrder: jest.fn(),
      updateWithIncludes: jest.fn(),
      delete: jest.fn(),
      findPaginated: jest.fn(),
    };
    sectionRepo = { findById: jest.fn() };
    adminRepo = {
      getDashboardCounts: jest.fn(),
      getRecentUsers: jest.fn(),
      getRecentCourses: jest.fn(),
      getMonthlyRevenue: jest.fn(),
      getRevenueDetails: jest.fn(),
      listRefundRequests: jest.fn(),
      markRefundPaid: jest.fn(),
      getCourseStats: jest.fn(),
    };
    notifRepo = { create: jest.fn().mockResolvedValue({}) };
    passwordService = { hashPassword: jest.fn().mockResolvedValue('hashed') };
    cache = { get: jest.fn(), set: jest.fn(), del: jest.fn().mockResolvedValue(undefined) };

    service = new AdminService(
      userRepo as any,
      courseRepo as any,
      orderRepo as any,
      lessonRepo as any,
      sectionRepo as any,
      adminRepo as any,
      notifRepo as any,
      passwordService as any,
      cache as any,
      mockQueue as any,  // emailQueue
      mockQueue as any,  // certificateQueue
      mockQueue as any,  // notificationQueue
      mockQueue as any,  // videoQueue
      mockQueue as any,  // walletQueue
    );
  });

  // ─── User Management ───────────────────────────────────────────────────────

  describe('createUser', () => {
    it('should create a user with hashed password', async () => {
      userRepo.findByUsernameOrEmail.mockResolvedValue(null);
      userRepo.createUser.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        username: 'test',
        password: 'hashed',
        role: 'student',
      });

      const result = await service.createUser({
        email: 'test@test.com',
        username: 'test',
        password: 'plain123',
      } as any);

      expect(passwordService.hashPassword).toHaveBeenCalledWith('plain123');
      expect(result).not.toHaveProperty('password');
    });

    it('should throw BadRequestException for duplicate email/username', async () => {
      userRepo.findByUsernameOrEmail.mockResolvedValue({ id: 'existing' });

      await expect(
        service.createUser({ email: 'dup@test.com', username: 'dup', password: 'p' } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteUser', () => {
    it('should soft-delete a user', async () => {
      userRepo.findById.mockResolvedValue({ id: 'user-1', role: 'student' });
      userRepo.update.mockResolvedValue({});

      await service.deleteUser('user-1', 'admin-1');

      expect(userRepo.update).toHaveBeenCalledWith('user-1', { isActive: false });
    });

    it('should prevent admin from deleting themselves', async () => {
      await expect(service.deleteUser('admin-1', 'admin-1')).rejects.toThrow(ForbiddenException);
    });

    it('should prevent deleting the last admin', async () => {
      userRepo.findById.mockResolvedValue({ id: 'user-1', role: 'admin' });
      userRepo.count.mockResolvedValue(1);

      await expect(service.deleteUser('user-1', 'admin-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('toggleUserStatus', () => {
    it('should toggle user active status', async () => {
      userRepo.findById.mockResolvedValue({ id: 'user-1', role: 'student', isActive: true });
      userRepo.update.mockResolvedValue({ id: 'user-1', isActive: false });

      const result = await service.toggleUserStatus('user-1', false);

      expect(userRepo.update).toHaveBeenCalledWith('user-1', { isActive: false });
    });

    it('should prevent deactivating the last active admin', async () => {
      userRepo.findById.mockResolvedValue({ id: 'admin-1', role: 'admin', isActive: true });
      userRepo.count.mockResolvedValue(1);

      await expect(service.toggleUserStatus('admin-1', false)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateUser', () => {
    it('should update user safe fields', async () => {
      userRepo.findById.mockResolvedValue({ id: 'user-1', role: 'student' });
      userRepo.update.mockResolvedValue({ id: 'user-1', firstName: 'Updated' });

      await service.updateUser('user-1', { firstName: 'Updated' } as any, 'admin-1');

      expect(userRepo.update).toHaveBeenCalledWith('user-1', { firstName: 'Updated' });
    });

    it('should prevent removing the last admin role', async () => {
      userRepo.findById.mockResolvedValue({ id: 'admin-1', role: 'admin' });
      userRepo.count.mockResolvedValue(1);

      await expect(
        service.updateUser('admin-1', { role: 'student' } as any, 'admin-2'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── Course Management ──────────────────────────────────────────────────────

  describe('publishCourse', () => {
    it('should publish a pending course', async () => {
      courseRepo.findById.mockResolvedValue({ id: 'course-1', status: 'pending' });
      courseRepo.update.mockResolvedValue({ id: 'course-1', status: 'published' });

      const result = await service.publishCourse('course-1');

      expect(result.status).toBe('published');
      expect(cache.del).toHaveBeenCalled();
    });

    it('should throw when course is not pending', async () => {
      courseRepo.findById.mockResolvedValue({ id: 'course-1', status: 'draft' });

      await expect(service.publishCourse('course-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw when course not found', async () => {
      courseRepo.findById.mockResolvedValue(null);

      await expect(service.publishCourse('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('rejectCourse', () => {
    it('should reject a pending course and notify the author', async () => {
      courseRepo.findById.mockResolvedValue({
        id: 'course-1',
        status: 'pending',
        title: 'Test',
        authorId: 'teacher-1',
      });
      courseRepo.update.mockResolvedValue({ id: 'course-1', status: 'draft' });

      await service.rejectCourse('course-1', 'Poor quality');

      expect(courseRepo.update).toHaveBeenCalledWith('course-1', { status: 'draft' });
      expect(notifRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'teacher-1',
          type: 'course_rejected',
        }),
      );
    });

    it('should throw when course is not pending', async () => {
      courseRepo.findById.mockResolvedValue({ id: 'course-1', status: 'published' });

      await expect(service.rejectCourse('course-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteCourse', () => {
    it('should delete course and invalidate cache', async () => {
      courseRepo.findById.mockResolvedValue({ id: 'course-1' });
      courseRepo.delete.mockResolvedValue({});

      await service.deleteCourse('course-1');

      expect(courseRepo.delete).toHaveBeenCalledWith('course-1');
      expect(cache.del).toHaveBeenCalledWith('courses:public:all');
    });

    it('should throw NotFoundException for non-existent course', async () => {
      courseRepo.findById.mockResolvedValue(null);

      await expect(service.deleteCourse('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Dashboard ──────────────────────────────────────────────────────────────

  describe('getDashboardStats', () => {
    it('should return formatted dashboard stats', async () => {
      adminRepo.getDashboardCounts.mockResolvedValue({
        totalUsers: 100,
        totalCourses: 20,
        totalLessons: 200,
        totalEnrollments: 500,
        revenue: 1000000,
        usersByRole: [
          { role: 'student', _count: { id: 80 } },
          { role: 'teacher', _count: { id: 15 } },
          { role: 'admin', _count: { id: 5 } },
        ],
        coursesByStatus: [
          { status: 'published', _count: { id: 15 } },
          { status: 'draft', _count: { id: 3 } },
          { status: 'pending', _count: { id: 2 } },
        ],
      });
      adminRepo.getRecentUsers.mockResolvedValue([]);
      adminRepo.getRecentCourses.mockResolvedValue([]);

      const result = await service.getDashboardStats();

      expect(result.users).toBe(100);
      expect(result.usersByRole.student).toBe(80);
      expect(result.coursesByStatus.published).toBe(15);
      expect(result.coursesByStatus.draft).toBe(3);
      expect(result.usersByRole.parent).toBe(0); // missing in data = default 0
    });
  });

  // ─── Queue Health ───────────────────────────────────────────────────────────

  describe('getQueueHealth', () => {
    it('should return job counts for all queues', async () => {
      const result = await service.getQueueHealth();

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('counts');
    });
  });

  describe('getFailedJobs', () => {
    it('should throw for unknown queue', async () => {
      await expect(service.getFailedJobs('nonexistent')).rejects.toThrow(BadRequestException);
    });
  });

  // ─── markRefundPaid ─────────────────────────────────────────────────────────

  describe('markRefundPaid', () => {
    it('should throw BadRequestException when bankTransferRef is missing', async () => {
      await expect(service.markRefundPaid('r1', 'admin-1', '')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when refund not found', async () => {
      adminRepo.markRefundPaid.mockResolvedValue(null);

      await expect(service.markRefundPaid('r1', 'admin-1', 'REF123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should mark refund paid and notify the parent', async () => {
      adminRepo.markRefundPaid.mockResolvedValue({
        alreadyPaid: false,
        refund: {
          id: 'refund-1',
          parentId: 'parent-1',
          orderId: 'order-1',
          amount: 50000,
          bankTransferRef: 'REF123',
        },
      });

      const result = await service.markRefundPaid('refund-1', 'admin-1', 'REF123');

      expect(result.id).toBe('refund-1');
      expect(notifRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'parent-1',
          type: 'refund_paid',
        }),
      );
    });
  });
});
