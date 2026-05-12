import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppEvents } from '../shared/events';
import {
  PaymentCompletedPayload,
  EnrollmentCreatedPayload,
  EnrollmentApprovedPayload,
  CourseCompletedPayload,
  CommentCreatedPayload,
} from '../shared/events';
import { NotificationRepository } from '../database/repositories';

/**
 * Listens to domain events and creates notifications.
 * This replaces direct `NotificationsService` injection in other modules,
 * breaking circular dependencies.
 */
@Injectable()
export class NotificationEventListener {
  private readonly logger = new Logger(NotificationEventListener.name);

  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  @OnEvent(AppEvents.PAYMENT_COMPLETED)
  async onPaymentCompleted(payload: PaymentCompletedPayload) {
    this.logger.log(`[Event] Payment completed for user ${payload.userId}`);

    const titles = payload.courseTitles;
    const summary =
      titles.length > 0
        ? `Enrollment confirmed for: ${titles.join(', ')}. Open Dashboard → My courses.`
        : 'Your payment was received and your courses are unlocked.';

    await this.notificationRepository
      .create({
        userId: payload.userId,
        title: 'Payment successful',
        message: summary,
        type: 'success',
      })
      .catch((err) => this.logger.warn(`Notification failed: ${err.message}`));
  }

  @OnEvent(AppEvents.ENROLLMENT_CREATED)
  async onEnrollmentCreated(payload: EnrollmentCreatedPayload) {
    this.logger.log(`[Event] Enrollment created for user ${payload.userId} → course ${payload.courseId}`);

    if (payload.isFree) {
      await this.notificationRepository
        .create({
          userId: payload.userId,
          title: 'Enrollment confirmed',
          message: `You are enrolled in "${payload.courseTitle}". Open Dashboard → My courses to start learning.`,
          type: 'success',
        })
        .catch((err) => this.logger.warn(`Notification failed: ${err.message}`));
    }
  }

  @OnEvent(AppEvents.ENROLLMENT_APPROVED)
  async onEnrollmentApproved(payload: EnrollmentApprovedPayload) {
    this.logger.log(`[Event] Enrollment approved for user ${payload.userId}`);

    await this.notificationRepository
      .create({
        userId: payload.userId,
        title: 'Đã duyệt vào lớp!',
        message: `Bạn đã được duyệt vào khóa "${payload.courseTitle}". Bắt đầu học ngay!`,
        type: 'success',
      })
      .catch((err) => this.logger.warn(`Notification failed: ${err.message}`));
  }

  @OnEvent(AppEvents.COURSE_COMPLETED)
  async onCourseCompleted(payload: CourseCompletedPayload) {
    this.logger.log(`[Event] Course completed by user ${payload.userId}`);

    await this.notificationRepository
      .create({
        userId: payload.userId,
        title: 'Chúc mừng! 🎉',
        message: `Bạn đã hoàn thành khóa "${payload.courseTitle}". Hãy nhận chứng chỉ!`,
        type: 'success',
      })
      .catch((err) => this.logger.warn(`Notification failed: ${err.message}`));
  }

  @OnEvent(AppEvents.COMMENT_CREATED)
  async onCommentCreated(payload: CommentCreatedPayload) {
    if (!payload.courseAuthorId) return;

    await this.notificationRepository
      .create({
        userId: payload.courseAuthorId,
        title: 'Bình luận mới',
        message: `Có bình luận mới trong bài giảng của bạn.`,
        type: 'info',
      })
      .catch((err) => this.logger.warn(`Notification failed: ${err.message}`));
  }
}
