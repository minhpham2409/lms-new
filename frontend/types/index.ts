export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
  avatarUrl?: string;
  bio?: string;
  createdAt?: string;
}

export interface Instructor {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface Lesson {
  id: string;
  title: string;
  content?: string;
  videoUrl?: string;
  duration?: number;
  order: number;
  sectionId: string;
  completed?: boolean;
  watchTime?: number;
}

export interface Section {
  id: string;
  title: string;
  order: number;
  courseId: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  price?: number;
  imageUrl?: string;
  level?: string;
  status?: string;
  authorId?: string;
  isPublished?: boolean;
  author: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  sections: Section[];
  _count: {
    sections?: number;
    enrollments: number;
  };
  averageRating?: number;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  progress: number;
  enrolledAt: string;
  course: Course;
}

export interface VideoProgress {
  id: string;
  userId: string;
  lessonId: string;
  watchTime: number;
  completed: boolean;
  lesson?: Lesson;
}

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  type: 'essay' | 'quiz';
  lessonId: string;
  dueDate?: string;
  maxScore: number;
  minScore?: number;
  lesson?: Lesson;
  quiz?: Quiz;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  content?: string;
  fileUrl?: string;
  score?: number;
  feedback?: string;
  status: 'submitted' | 'graded';
  gradedAt?: string;
  student?: User;
}

export interface Quiz {
  id: string;
  assignmentId: string;
  timeLimit?: number;
  questions: Question[];
}

export interface Question {
  id: string;
  quizId: string;
  content: string;
  options: string[];
  answer: string;
  score: number;
  order: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  answers: Record<string, string>;
  score: number;
  maxScore: number;
}

export interface CartItem {
  id: string;
  userId: string;
  courseId: string;
  course: Course;
}

export interface Coupon {
  id: string;
  code: string;
  discount: number;
  maxUses: number;
  usedCount: number;
  expiresAt?: string;
  isActive: boolean;
}

export interface Order {
  id: string;
  userId: string;
  user?: User;
  couponId?: string;
  totalPrice: number;
  finalPrice: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
  payment?: Payment;
  coupon?: Coupon;
}

export interface OrderItem {
  id: string;
  orderId: string;
  courseId: string;
  price: number;
  course?: Course;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  status: string;
  qrData?: string;
  txnRef?: string;
  paidAt?: string;
}

export interface Review {
  id: string;
  courseId: string;
  userId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  user?: User;
}

export interface Comment {
  id: string;
  lessonId: string;
  userId: string;
  content: string;
  parentId?: string;
  createdAt: string;
  user?: User;
  replies?: Comment[];
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  type: string;
  createdAt: string;
}

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  code: string;
  issuedAt: string;
  course?: Course;
}

export interface ParentChild {
  id: string;
  parentId: string;
  childId: string;
  status: 'pending' | 'accepted';
  createdAt?: string;
  updatedAt?: string;
  child?: User;
  parent?: User;
}

/** GET /parents/children/:id/dashboard */
export interface ParentChildDashboardEnrollment {
  id: string;
  userId: string;
  courseId: string;
  status: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
  course: Course & {
    description?: string | null;
    price?: number;
    status?: string;
    thumbnail?: string | null;
    author: {
      id: string;
      username: string;
      firstName?: string | null;
      lastName?: string | null;
      email?: string;
    };
    _count: { sections: number };
  };
  stats: { totalLessons: number; completedLessons: number };
}

export interface ParentChildDashboard {
  child: {
    id: string;
    username: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    createdAt: string;
    isActive: boolean;
  };
  link: { id: string; linkedAt: string; updatedAt: string };
  enrollments: ParentChildDashboardEnrollment[];
  certificates: Certificate[];
  activity: {
    quizAttempts: number;
    assignmentSubmissions: number;
    videoLessonsCompleted: number;
  };
}

export interface CreateCourseData {
  title: string;
  description: string;
  price?: number;
  imageUrl?: string;
  level?: string;
}

export interface UpdateCourseData {
  title?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  level?: string;
  isPublished?: boolean;
}

export interface CreateSectionData {
  title: string;
  order?: number;
}

export interface CreateLessonData {
  title: string;
  content?: string;
  videoUrl?: string;
  duration?: number;
  sectionId: string;
}

export interface UpdateLessonData {
  title?: string;
  content?: string;
  videoUrl?: string;
  duration?: number;
  order?: number;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  role?: string;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  password?: string;
  role?: string;
  isActive?: boolean;
}

export interface ProgressData {
  courseId: string;
  overallProgress: number;
  completedLessons: number;
  totalLessons: number;
}

export interface LessonWithProgress extends Lesson {
  completed: boolean;
  watchTime: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
}

export interface CouponPreview {
  code: string;
  discount: number;
  originalTotal: number;
  finalTotal: number;
}
