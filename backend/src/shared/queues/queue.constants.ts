/**
 * Bull Queue constants for background job processing.
 *
 * Naming convention: `<domain>-queue` (lowercase, hyphen-separated)
 *
 * These queues use Redis via @nestjs/bull for heavy async tasks
 * that should NOT block the API response (email, PDF, etc.).
 */
export const QueueNames = {
  /** Email sending queue (invoice emails, welcome emails, password resets) */
  EMAIL: 'email-queue',


  /** Notification delivery queue (batched, non-critical) */
  NOTIFICATION: 'notification-queue',

  /** Video processing queue (HLS conversion, thumbnails, etc.) */
  VIDEO: 'video-queue',

  /** Wallet/revenue queue (teacher revenue split, payout side effects) */
  WALLET: 'wallet-queue',
} as const;

export type QueueName = (typeof QueueNames)[keyof typeof QueueNames];

/**
 * Job names within each queue (for routing to specific handlers)
 */
export const JobNames = {
  // Email queue jobs
  SEND_PAYMENT_INVOICE: 'send-payment-invoice',
  SEND_WELCOME_EMAIL: 'send-welcome-email',
  SEND_PASSWORD_RESET: 'send-password-reset',
  SEND_ENROLLMENT_CONFIRMATION: 'send-enrollment-confirmation',


  // Notification queue jobs
  SEND_BULK_NOTIFICATION: 'send-bulk-notification',

  // Video queue jobs
  CONVERT_VIDEO_HLS: 'convert-video-hls',

  // Wallet queue jobs
  SPLIT_ORDER_REVENUE: 'split-order-revenue',
} as const;

export type JobName = (typeof JobNames)[keyof typeof JobNames];
