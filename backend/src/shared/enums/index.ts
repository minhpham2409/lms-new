export enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
  PARENT = 'parent',
}

export enum CourseStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum AssignmentType {
  ESSAY = 'essay',
  QUIZ = 'quiz',
}

export enum UnlockMode {
  VIDEO_COMPLETION = 'video_completion',
  ASSIGNMENT_SCORE = 'assignment_score',
  BOTH = 'both',
  NONE = 'none',
}
