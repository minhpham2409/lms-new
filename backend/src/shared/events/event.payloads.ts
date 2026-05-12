/**
 * Event payload interfaces for type-safe event emission and handling.
 */

export interface PaymentCompletedPayload {
  paymentId: string;
  orderId: string;
  userId: string;
  amount: number;
  courseIds: string[];
  courseTitles: string[];
}

export interface PaymentFailedPayload {
  paymentId: string;
  orderId: string;
  userId: string;
  reason?: string;
}

export interface EnrollmentCreatedPayload {
  enrollmentId: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  isFree: boolean;
}

export interface EnrollmentApprovedPayload {
  enrollmentId: string;
  userId: string;
  courseId: string;
  courseTitle: string;
}

export interface LessonCompletedPayload {
  userId: string;
  lessonId: string;
  courseId: string;
}

export interface CourseCompletedPayload {
  userId: string;
  courseId: string;
  courseTitle: string;
}

export interface ProgressUpdatedPayload {
  userId: string;
  courseId: string;
  progress: number;
}

export interface BadgeCheckRequestedPayload {
  userId: string;
  /** Optional: hint which category triggered the check */
  triggerCategory?: 'streak' | 'course' | 'quiz' | 'certificate' | 'video' | 'assignment' | 'social' | 'enrollment';
}

export interface BadgeEarnedPayload {
  userId: string;
  badgeCodes: string[];
}

export interface OrderCreatedPayload {
  orderId: string;
  userId: string;
  totalPrice: number;
  finalPrice: number;
  courseIds: string[];
}

export interface UserRegisteredPayload {
  userId: string;
  username: string;
  email: string;
  role: string;
}

export interface CertificateGeneratedPayload {
  certificateId: string;
  userId: string;
  courseId: string;
  courseTitle: string;
}

export interface CommentCreatedPayload {
  commentId: string;
  userId: string;
  lessonId: string;
  courseAuthorId?: string;
}

export interface QuizSubmittedPayload {
  attemptId: string;
  userId: string;
  quizId: string;
  score: number;
}
