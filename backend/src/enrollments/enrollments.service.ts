import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EnrollmentRepository, CourseRepository } from '../database/repositories';
import { AppEvents } from '../shared/events';
import {
  EnrollmentCreatedPayload,
  EnrollmentApprovedPayload,
} from '../shared/events';

@Injectable()
export class EnrollmentsService {
  constructor(
    private readonly enrollmentRepository: EnrollmentRepository,
    private readonly courseRepository: CourseRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async enroll(userId: string, courseId: string) {
    const existingEnrollment = await this.enrollmentRepository.findByUserAndCourse(userId, courseId);

    if (existingEnrollment) {
      throw new ConflictException('User is already enrolled in this course');
    }

    const course = await this.courseRepository.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');
    if (course.status !== 'published') {
      throw new BadRequestException(
        'This course is not available for enrollment yet',
      );
    }

    // Paid courses must go through the payment flow
    if (Number(course.price) > 0) {
      throw new BadRequestException(
        'This is a paid course. Please purchase it through the cart and payment flow.',
      );
    }

    const enrollment = await this.enrollmentRepository.createEnrollment(userId, courseId);

    // Emit event instead of calling NotificationsService directly
    this.eventEmitter.emit(AppEvents.ENROLLMENT_CREATED, {
      enrollmentId: enrollment.id,
      userId,
      courseId,
      courseTitle: course.title,
      isFree: true,
    } as EnrollmentCreatedPayload);

    return enrollment;
  }

  /** Create a pending enrollment for paid courses (after order is created) */
  async createPending(userId: string, courseId: string) {
    const existingEnrollment = await this.enrollmentRepository.findByUserAndCourse(userId, courseId);

    if (existingEnrollment) {
      // If already pending, just return it
      if (existingEnrollment.status === 'pending') return existingEnrollment;
      throw new ConflictException('User is already enrolled in this course');
    }

    const course = await this.courseRepository.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');

    const enrollment = await this.enrollmentRepository.createEnrollment(userId, courseId, {
      status: 'pending',
      progress: 0,
    });

    // Emit event — NotificationEventListener will handle teacher + parent notifications
    this.eventEmitter.emit(AppEvents.ENROLLMENT_CREATED, {
      enrollmentId: enrollment.id,
      userId,
      courseId,
      courseTitle: course.title,
      isFree: false,
    } as EnrollmentCreatedPayload);

    return enrollment;
  }

  /** Teacher/admin: get enrollments for a course, optionally filtered by status */
  async getEnrollmentsByCourse(courseId: string, user: any, status?: string) {
    // Verify the teacher owns the course (or is admin)
    if (user.role === 'teacher') {
      const course = await this.courseRepository.findById(courseId);
      if (!course || course.authorId !== user.id) {
        throw new ForbiddenException('Not your course');
      }
    }

    return this.enrollmentRepository.findByCourse(courseId, status);
  }

  /**
   * Teacher/admin: approve a pending enrollment.
   * Teachers can only approve FREE course enrollments.
   * Paid course enrollments must be activated by webhook or admin.
   */
  async approveEnrollment(enrollmentId: string, user: any) {
    const enrollment = await this.enrollmentRepository.findByIdWithCourse(enrollmentId);
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    // Check ownership
    if (user.role === 'teacher' && enrollment.course.authorId !== user.id) {
      throw new ForbiddenException('Not your course');
    }

    // Teachers cannot approve paid course enrollments — only admin/webhook can
    if (user.role === 'teacher' && Number(enrollment.course.price) > 0) {
      throw new ForbiddenException(
        'Không thể duyệt khóa học trả phí. Chỉ admin hoặc hệ thống thanh toán mới có quyền xác nhận.',
      );
    }

    // Atomic transaction: activate enrollment + mark orders/payments as paid
    const updated = await this.enrollmentRepository.approveEnrollmentTransaction({
      enrollmentId,
      userId: enrollment.userId,
      courseId: enrollment.courseId,
    });

    // Emit event — NotificationEventListener handles user notification
    this.eventEmitter.emit(AppEvents.ENROLLMENT_APPROVED, {
      enrollmentId,
      userId: enrollment.userId,
      courseId: enrollment.courseId,
      courseTitle: enrollment.course.title,
    } as EnrollmentApprovedPayload);

    return updated;
  }

  async getEnrollmentStatus(userId: string, courseId: string) {
    const enrollment = await this.enrollmentRepository.findByUserAndCourse(userId, courseId);
    return {
      isEnrolled: enrollment?.status === 'active',
      enrollment: enrollment || null,
    };
  }

  async getUserEnrollments(userId: string) {
    return this.enrollmentRepository.findByUser(userId);
  }

  async updateProgress(userId: string, courseId: string, progress: number) {
    const enrollment = await this.enrollmentRepository.findByUserAndCourse(userId, courseId);
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    return this.enrollmentRepository.updateProgress(enrollment.id, progress);
  }

  async unenroll(userId: string, courseId: string) {
    const enrollment = await this.enrollmentRepository.findByUserAndCourse(userId, courseId);
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    return this.enrollmentRepository.deleteEnrollment(enrollment.id);
  }
}
