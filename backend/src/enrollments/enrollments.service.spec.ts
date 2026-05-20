import {
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { AppEvents } from '../shared/events';

describe('EnrollmentsService', () => {
  let service: EnrollmentsService;
  let enrollmentRepo: {
    findByUserAndCourse: jest.Mock;
    createEnrollment: jest.Mock;
    findByIdWithCourse: jest.Mock;
    approveEnrollmentTransaction: jest.Mock;
    findByCourse: jest.Mock;
    findByUser: jest.Mock;
    updateProgress: jest.Mock;
    deleteEnrollment: jest.Mock;
    findOrderItemsForEnrollment: jest.Mock;
  };
  let courseRepo: { findById: jest.Mock };
  let eventEmitter: { emit: jest.Mock };

  beforeEach(() => {
    enrollmentRepo = {
      findByUserAndCourse: jest.fn(),
      createEnrollment: jest.fn(),
      findByIdWithCourse: jest.fn(),
      approveEnrollmentTransaction: jest.fn(),
      findByCourse: jest.fn(),
      findByUser: jest.fn(),
      updateProgress: jest.fn(),
      deleteEnrollment: jest.fn(),
      findOrderItemsForEnrollment: jest.fn(),
    };
    courseRepo = { findById: jest.fn() };
    eventEmitter = { emit: jest.fn() };

    service = new EnrollmentsService(
      enrollmentRepo as any,
      courseRepo as any,
      eventEmitter as any,
    );
  });

  // ─── enroll (free courses) ──────────────────────────────────────────────────

  describe('enroll', () => {
    it('should enroll a user in a free published course', async () => {
      enrollmentRepo.findByUserAndCourse.mockResolvedValue(null);
      courseRepo.findById.mockResolvedValue({
        id: 'course-1',
        title: 'Free Course',
        status: 'published',
        price: 0,
      });
      enrollmentRepo.createEnrollment.mockResolvedValue({ id: 'enroll-1' });

      const result = await service.enroll('user-1', 'course-1');

      expect(result.id).toBe('enroll-1');
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        AppEvents.ENROLLMENT_CREATED,
        expect.objectContaining({ userId: 'user-1', courseId: 'course-1', isFree: true }),
      );
    });

    it('should reject duplicate enrollment', async () => {
      enrollmentRepo.findByUserAndCourse.mockResolvedValue({ id: 'existing' });

      await expect(service.enroll('user-1', 'course-1')).rejects.toThrow(ConflictException);
    });

    it('should reject enrollment for non-existent course', async () => {
      enrollmentRepo.findByUserAndCourse.mockResolvedValue(null);
      courseRepo.findById.mockResolvedValue(null);

      await expect(service.enroll('user-1', 'course-1')).rejects.toThrow(NotFoundException);
    });

    it('should reject enrollment for draft course', async () => {
      enrollmentRepo.findByUserAndCourse.mockResolvedValue(null);
      courseRepo.findById.mockResolvedValue({ id: 'course-1', status: 'draft', price: 0 });

      await expect(service.enroll('user-1', 'course-1')).rejects.toThrow(BadRequestException);
    });

    it('should reject enrollment for paid course (must go through payment flow)', async () => {
      enrollmentRepo.findByUserAndCourse.mockResolvedValue(null);
      courseRepo.findById.mockResolvedValue({
        id: 'course-1',
        status: 'published',
        price: 100,
      });

      await expect(service.enroll('user-1', 'course-1')).rejects.toThrow(BadRequestException);
    });
  });

  // ─── createPending ──────────────────────────────────────────────────────────

  describe('createPending', () => {
    it('should create a pending enrollment for paid courses', async () => {
      enrollmentRepo.findByUserAndCourse.mockResolvedValue(null);
      courseRepo.findById.mockResolvedValue({ id: 'course-1', title: 'Paid Course' });
      enrollmentRepo.createEnrollment.mockResolvedValue({ id: 'enroll-1', status: 'pending' });

      const result = await service.createPending('user-1', 'course-1');

      expect(result.status).toBe('pending');
      expect(enrollmentRepo.createEnrollment).toHaveBeenCalledWith(
        'user-1', 'course-1', { status: 'pending', progress: 0 },
      );
    });

    it('should return existing pending enrollment without creating duplicate', async () => {
      enrollmentRepo.findByUserAndCourse.mockResolvedValue({ id: 'existing', status: 'pending' });

      const result = await service.createPending('user-1', 'course-1');

      expect(result.id).toBe('existing');
      expect(enrollmentRepo.createEnrollment).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when active enrollment exists', async () => {
      enrollmentRepo.findByUserAndCourse.mockResolvedValue({ id: 'existing', status: 'active' });

      await expect(service.createPending('user-1', 'course-1')).rejects.toThrow(ConflictException);
    });
  });

  // ─── approveEnrollment ──────────────────────────────────────────────────────

  describe('approveEnrollment', () => {
    it('should approve enrollment for free course by teacher', async () => {
      enrollmentRepo.findByIdWithCourse.mockResolvedValue({
        id: 'enroll-1',
        userId: 'student-1',
        courseId: 'course-1',
        course: { authorId: 'teacher-1', title: 'Free Course', price: 0 },
      });
      enrollmentRepo.approveEnrollmentTransaction.mockResolvedValue({ id: 'enroll-1', status: 'active' });

      const user = { id: 'teacher-1', role: 'teacher' };
      const result = await service.approveEnrollment('enroll-1', user);

      expect(result.status).toBe('active');
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        AppEvents.ENROLLMENT_APPROVED,
        expect.objectContaining({ enrollmentId: 'enroll-1' }),
      );
    });

    it('should NOT allow teacher to approve paid course enrollment', async () => {
      enrollmentRepo.findByIdWithCourse.mockResolvedValue({
        id: 'enroll-1',
        userId: 'student-1',
        courseId: 'course-1',
        course: { authorId: 'teacher-1', title: 'Paid', price: 500 },
      });

      const user = { id: 'teacher-1', role: 'teacher' };
      await expect(service.approveEnrollment('enroll-1', user)).rejects.toThrow(ForbiddenException);
    });

    it('should NOT allow a different teacher to approve enrollment', async () => {
      enrollmentRepo.findByIdWithCourse.mockResolvedValue({
        id: 'enroll-1',
        userId: 'student-1',
        courseId: 'course-1',
        course: { authorId: 'teacher-1', title: 'Course', price: 0 },
      });

      const user = { id: 'other-teacher', role: 'teacher' };
      await expect(service.approveEnrollment('enroll-1', user)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when enrollment does not exist', async () => {
      enrollmentRepo.findByIdWithCourse.mockResolvedValue(null);

      await expect(
        service.approveEnrollment('bad-id', { id: 'admin-1', role: 'admin' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should allow admin to approve paid course and emit PAYMENT_COMPLETED', async () => {
      enrollmentRepo.findByIdWithCourse.mockResolvedValue({
        id: 'enroll-1',
        userId: 'student-1',
        courseId: 'course-1',
        course: { authorId: 'teacher-1', title: 'Paid Course', price: 500 },
      });
      enrollmentRepo.approveEnrollmentTransaction.mockResolvedValue({ id: 'enroll-1', status: 'active' });
      enrollmentRepo.findOrderItemsForEnrollment.mockResolvedValue([
        { orderId: 'order-1', order: { finalPrice: 500 } },
      ]);

      const user = { id: 'admin-1', role: 'admin' };
      await service.approveEnrollment('enroll-1', user);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        AppEvents.PAYMENT_COMPLETED,
        expect.objectContaining({
          orderId: 'order-1',
          userId: 'student-1',
          amount: 500,
        }),
      );
    });
  });

  // ─── getEnrollmentStatus ────────────────────────────────────────────────────

  describe('getEnrollmentStatus', () => {
    it('should return enrolled status for active enrollment', async () => {
      enrollmentRepo.findByUserAndCourse.mockResolvedValue({ status: 'active' });

      const result = await service.getEnrollmentStatus('user-1', 'course-1');

      expect(result.isEnrolled).toBe(true);
    });

    it('should return not enrolled for pending enrollment', async () => {
      enrollmentRepo.findByUserAndCourse.mockResolvedValue({ status: 'pending' });

      const result = await service.getEnrollmentStatus('user-1', 'course-1');

      expect(result.isEnrolled).toBe(false);
    });

    it('should return not enrolled when no enrollment', async () => {
      enrollmentRepo.findByUserAndCourse.mockResolvedValue(null);

      const result = await service.getEnrollmentStatus('user-1', 'course-1');

      expect(result.isEnrolled).toBe(false);
      expect(result.enrollment).toBeNull();
    });
  });

  // ─── unenroll ───────────────────────────────────────────────────────────────

  describe('unenroll', () => {
    it('should delete enrollment', async () => {
      enrollmentRepo.findByUserAndCourse.mockResolvedValue({ id: 'enroll-1' });
      enrollmentRepo.deleteEnrollment.mockResolvedValue({ id: 'enroll-1' });

      await service.unenroll('user-1', 'course-1');

      expect(enrollmentRepo.deleteEnrollment).toHaveBeenCalledWith('enroll-1');
    });

    it('should throw NotFoundException when not enrolled', async () => {
      enrollmentRepo.findByUserAndCourse.mockResolvedValue(null);

      await expect(service.unenroll('user-1', 'course-1')).rejects.toThrow(NotFoundException);
    });
  });
});
