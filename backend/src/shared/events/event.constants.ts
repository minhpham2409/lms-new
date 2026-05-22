/**
 * Domain Event constants for the Event-Driven Architecture.
 *
 * Naming convention: `<domain>.<action>` (lowercase, dot-separated)
 *
 * These events are emitted via @nestjs/event-emitter (in-process, synchronous)
 * for lightweight cross-module communication without circular dependencies.
 */
export const AppEvents = {
  // ─── Payment Events ──────────────────────────────────────────────────────
  /** Emitted when a payment is successfully completed (webhook confirmed). */
  PAYMENT_COMPLETED: 'payment.completed',

  /** Emitted when a payment fails. */
  PAYMENT_FAILED: 'payment.failed',

  // ─── Enrollment Events ───────────────────────────────────────────────────
  /** Emitted when a student enrolls in a course (free or paid). */
  ENROLLMENT_CREATED: 'enrollment.created',

  /** Emitted when a teacher/admin approves a pending enrollment. */
  ENROLLMENT_APPROVED: 'enrollment.approved',

  // ─── Progress Events ─────────────────────────────────────────────────────
  /** Emitted when a student completes a lesson (video watched + assignments done). */
  LESSON_COMPLETED: 'lesson.completed',

  /** Emitted when course progress reaches 100%. */
  COURSE_COMPLETED: 'course.completed',

  /** Emitted whenever course progress is updated. */
  PROGRESS_UPDATED: 'progress.updated',

  // ─── Achievement Events ──────────────────────────────────────────────────
  /** Request a badge check for a user (fire-and-forget). */
  BADGE_CHECK_REQUESTED: 'badge.check.requested',

  /** Emitted when a user earns a new badge. */
  BADGE_EARNED: 'badge.earned',

  // ─── Order Events ────────────────────────────────────────────────────────
  /** Emitted when an order is created. */
  ORDER_CREATED: 'order.created',

  // ─── User Events ─────────────────────────────────────────────────────────
  /** Emitted when a new user registers. */
  USER_REGISTERED: 'user.registered',

  /** Emitted when a user's streak is updated. */
  STREAK_UPDATED: 'streak.updated',

  // ─── Comment Events ──────────────────────────────────────────────────────
  /** Emitted when a comment is posted on a lesson. */
  COMMENT_CREATED: 'comment.created',

  // ─── Quiz Events ─────────────────────────────────────────────────────────
  /** Emitted when a student submits a quiz attempt. */
  QUIZ_SUBMITTED: 'quiz.submitted',
} as const;

/** Type-safe event name union */
export type AppEvent = (typeof AppEvents)[keyof typeof AppEvents];
