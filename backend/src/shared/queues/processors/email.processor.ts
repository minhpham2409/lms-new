import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { QueueNames, JobNames } from '..';

/**
 * Bull processor for email-related background jobs.
 * Processes jobs from the EMAIL queue asynchronously via Redis.
 *
 * In production, integrate with an email service (SendGrid, SES, Resend, etc.)
 * For now, jobs are logged and acknowledged (no-op).
 */
@Processor(QueueNames.EMAIL)
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  @Process(JobNames.SEND_PAYMENT_INVOICE)
  async handlePaymentInvoice(job: Job<{ userId: string; orderId: string; amount: number }>) {
    this.logger.log(`[Email Queue] Processing payment invoice for order ${job.data.orderId}`);
    // TODO: Integrate with email service (SendGrid, SES, Resend)
    // await this.emailService.sendPaymentInvoice(job.data);
    this.logger.log(`[Email Queue] Payment invoice processed for order ${job.data.orderId}`);
  }

  @Process(JobNames.SEND_WELCOME_EMAIL)
  async handleWelcomeEmail(job: Job<{ userId: string; email: string; username: string }>) {
    this.logger.log(`[Email Queue] Sending welcome email to ${job.data.email}`);
    // TODO: Integrate with email service
    // await this.emailService.sendWelcomeEmail(job.data);
    this.logger.log(`[Email Queue] Welcome email sent to ${job.data.email}`);
  }

  @Process(JobNames.SEND_PASSWORD_RESET)
  async handlePasswordReset(job: Job<{ email: string; resetToken: string }>) {
    this.logger.log(`[Email Queue] Sending password reset email to ${job.data.email}`);
    // TODO: Integrate with email service
    // await this.emailService.sendPasswordResetEmail(job.data);
    this.logger.log(`[Email Queue] Password reset email sent to ${job.data.email}`);
  }

  @Process(JobNames.SEND_ENROLLMENT_CONFIRMATION)
  async handleEnrollmentConfirmation(
    job: Job<{ userId: string; courseTitle: string; email: string }>,
  ) {
    this.logger.log(`[Email Queue] Sending enrollment confirmation for "${job.data.courseTitle}"`);
    // TODO: Integrate with email service
    // await this.emailService.sendEnrollmentConfirmation(job.data);
    this.logger.log(`[Email Queue] Enrollment confirmation sent for "${job.data.courseTitle}"`);
  }
}
